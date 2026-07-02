import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/contexts/SupabaseContext';
import { ChevronRight, ChevronLeft, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Service {
  id: string;
  title: string;
  price: number;
  duration?: number;
}

interface BookedSlot {
  time: string; // "HH:MM"
  duration: number; // minutes, from the booked service
}

// Working hours for booking slots: 09:00 - 22:00, offered every hour on the hour
const OPENING_MINUTES = 9 * 60; // 09:00
const LAST_SLOT_MINUTES = 22 * 60; // 22:00 is the last bookable start time
const DAY_CLOSE_MINUTES = 23 * 60; // salon fully closes at 23:00; a service must finish by then
const SLOT_INTERVAL_MINUTES = 60; // slots offered every 1 hour: 9,10,11...22
const DEFAULT_DURATION_MINUTES = 60; // fallback if a service has no duration set

function toHHMM(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// All possible slot start times across the working day (before filtering by duration/overlap).
// Includes 23:00 as the last bookable slot.
function generateBaseSlots(): string[] {
  const slots: string[] = [];
  for (let t = OPENING_MINUTES; t <= LAST_SLOT_MINUTES; t += SLOT_INTERVAL_MINUTES) {
    slots.push(toHHMM(t));
  }
  return slots;
}

const BASE_TIME_SLOTS = generateBaseSlots();

// Given the selected service's duration and the day's existing bookings (each with their own
// duration), return which of the base slots are actually available — i.e. the service's full
// duration fits before closing time and doesn't overlap any existing booked interval.
// `minStartMinutes` (optional) blocks any slot starting before that time — used when the
// selected date is today, so customers can't book a time that has already passed.
function getAvailableSlots(
  serviceDuration: number,
  bookedSlots: BookedSlot[],
  minStartMinutes: number = 0
): { slot: string; available: boolean }[] {
  const bookedIntervals = bookedSlots.map((b) => {
    const start = toMinutes(b.time);
    const end = start + (b.duration || DEFAULT_DURATION_MINUTES);
    return { start, end };
  });

  return BASE_TIME_SLOTS.map((slot) => {
    const start = toMinutes(slot);
    const end = start + serviceDuration;

    // Must not be in the past (only relevant when booking for today)
    if (start < minStartMinutes) {
      return { slot, available: false };
    }

    // Must fit within working hours (finish by closing time)
    if (end > DAY_CLOSE_MINUTES) {
      return { slot, available: false };
    }

    // Must not overlap any existing booking
    const overlaps = bookedIntervals.some(
      (b) => start < b.end && end > b.start
    );

    return { slot, available: !overlaps };
  });
}

const bookingSchema = z.object({
  name: z.string().min(2, 'Нэр хамгийн багадаа 2 тэмдэгттэй байх ёстой'),
  phone: z.string().regex(/^[0-9+\-\s()]+$/, 'Утасны дугаар буруу байна'),
  termsAccepted: z.boolean().refine((val) => val === true, 'Та үйлчилгээний нөхцөлийг зөвшөөрөх ёстой'),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export default function BookingPage() {
  const location = useLocation();
  const preselectedServiceId = (location.state as { serviceId?: string } | null)?.serviceId;
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [formData, setFormData] = useState<BookingFormData | null>(null);

  // QPay invoice state
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string | null>(null);
  const [paymentUrls, setPaymentUrls] = useState<{ name: string; link: string }[]>([]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setServices(data || []);

        // If we arrived here via "clicking a service image/button" elsewhere on the site,
        // auto-select that service and jump straight to date/time selection.
        if (preselectedServiceId) {
          const match = (data || []).find((s: Service) => s.id === preselectedServiceId);
          if (match) {
            setSelectedService(match);
            setStep(2);
          }
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  // Fetch already-booked slots (with their durations) for the selected date
  useEffect(() => {
    if (!selectedDate) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      setLoadingSlots(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('time, status, services(duration)')
          .eq('date', selectedDate)
          .in('status', ['pending_payment', 'confirmed', 'completed']);

        if (error) throw error;

        const taken: BookedSlot[] = (data || []).map((b: any) => ({
          time: (b.time as string).slice(0, 5),
          duration: b.services?.duration || DEFAULT_DURATION_MINUTES,
        }));
        setBookedSlots(taken);
      } catch (error) {
        console.error('Error fetching booked slots:', error);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchBookedSlots();
    // Reset time selection when date changes
    setSelectedTime('');
  }, [selectedDate]);

  // Recompute which slots are available whenever the service, date, or existing bookings change
  const availableSlots = useMemo(() => {
    const duration = selectedService?.duration || DEFAULT_DURATION_MINUTES;

    // If the selected date is today, block slots that have already passed
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const minStartMinutes =
      selectedDate === todayStr ? now.getHours() * 60 + now.getMinutes() : 0;

    return getAvailableSlots(duration, bookedSlots, minStartMinutes);
  }, [selectedService, bookedSlots, selectedDate]);

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedService || !selectedDate || !selectedTime) {
      alert('Захиалгын бүх мэдээллийг сонгоно уу');
      return;
    }

    setFormData(data);
    setPaymentRequired(true);
    setPaymentError(null);
    await createQpayInvoice(data);
  };

  // Calls our backend (/api/qpay-create-invoice) which validates the slot server-side,
  // holds it with a pending_payment booking row, and creates a real QPay invoice.
  const createQpayInvoice = async (data: BookingFormData) => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setLoading(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/qpay-create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: selectedDate,
          time: selectedTime,
          customerName: data.name,
          customerPhone: data.phone,
        }),
      });

      const result = await res.json();

      if (res.status === 409) {
        const message =
          result.error === 'SLOT_IN_PAST'
            ? 'Уучлаарай, энэ цаг өнгөрчихсөн байна. Өөр цаг сонгоно уу.'
            : 'Уучлаарай, энэ цаг дөнгөж сая захиалагдчихлаа. Өөр цаг сонгоно уу.';
        alert(message);
        setPaymentRequired(false);
        setSelectedTime('');
        // Refresh booked slots so the picker reflects the new state
        const { data: refreshed } = await supabase
          .from('bookings')
          .select('time, status, services(duration)')
          .eq('date', selectedDate)
          .in('status', ['pending_payment', 'confirmed', 'completed']);
        setBookedSlots(
          (refreshed || []).map((b: any) => ({
            time: (b.time as string).slice(0, 5),
            duration: b.services?.duration || DEFAULT_DURATION_MINUTES,
          }))
        );
        setStep(2);
        return;
      }

      if (!res.ok) {
        throw new Error(result.error || 'Нэхэмжлэл үүсгэхэд алдаа гарлаа');
      }

      setBookingId(result.bookingId);
      setQrImage(result.qrImage);
      setQrText(result.qrText);
      setPaymentUrls(result.urls || []);
    } catch (error: any) {
      console.error('Error creating QPay invoice:', error);
      setPaymentError(error.message || 'Төлбөрийн нэхэмжлэл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  // Poll our backend every 3s while the QR is showing, to detect when the customer
  // has paid via QPay. This complements the QPay webhook (qpay-callback), which
  // updates the booking server-side even if the customer closes this tab.
  useEffect(() => {
    if (!paymentRequired || !bookingId || bookingComplete) return;

    const interval = setInterval(async () => {
      setCheckingPayment(true);
      try {
        const res = await fetch('/api/qpay-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });
        const result = await res.json();

        if (result.status === 'confirmed') {
          clearInterval(interval);
          setBookingComplete(true);
          setPaymentRequired(false);
          setTimeout(() => {
            setStep(1);
            setSelectedService(null);
            setSelectedDate('');
            setSelectedTime('');
            setBookedSlots([]);
            setBookingComplete(false);
            setFormData(null);
            setBookingId(null);
            setQrImage(null);
            setQrText(null);
            setPaymentUrls([]);
          }, 3000);
        } else if (result.status === 'expired' || result.status === 'cancelled') {
          clearInterval(interval);
          setPaymentError('Төлбөрийн хугацаа дууссан байна. Дахин цаг захиална уу.');
          setPaymentRequired(false);
          setStep(2);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      } finally {
        setCheckingPayment(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [paymentRequired, bookingId, bookingComplete]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <AnimatePresence>
          {bookingComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="mb-8 bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center"
            >
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="font-playfair text-2xl font-bold text-green-900 mb-2">
                Захиалга Баталгаажлаа!
              </h3>
              <p className="font-manrope text-green-800">
                Таны цаг амжилттай захиалагдлаа. Баталгаажуулах мэдээллийг утаснаасаа шалгана уу.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Booking Form */}
        {!bookingComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-3xl shadow-xl p-8 md:p-12"
          >
            {/* Steps Indicator */}
            <div className="flex items-center justify-between mb-12">
              {[1, 2, 3, 4].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`flex flex-col items-center ${
                    stepNum < 4 ? 'flex-1 mr-4' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                      step >= stepNum
                        ? 'bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNum}
                  </div>
                  <span className={`text-xs font-manrope hidden sm:inline ${
                    step >= stepNum ? 'text-[#C9A86A]' : 'text-gray-600'
                  }`}>
                    {['Үйлчилгээ', 'Огноо', 'Мэдээлэл', 'Төлбөр'][stepNum - 1]}
                  </span>
                  {stepNum < 4 && (
                    <div
                      className={`absolute ml-16 h-1 w-8 mt-6 transition-all ${
                        step > stepNum
                          ? 'bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A]'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Service Selection */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-6">
                    Үйлчилгээ Сонгох
                  </h2>
                  <div className="space-y-3 mb-8">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                          selectedService?.id === service.id
                            ? 'border-[#C9A86A] bg-[#C9A86A]/10'
                            : 'border-gray-200 hover:border-[#C9A86A]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-playfair text-lg font-bold text-[#1F1F1F]">
                              {service.title}
                            </h3>
                            {service.duration && (
                              <p className="font-manrope text-sm text-gray-600 mt-1">
                                Үргэлжлэх хугацаа: {service.duration} минут
                              </p>
                            )}
                          </div>
                          <p className="font-playfair text-2xl font-bold text-[#C9A86A]">
                            {service.price.toLocaleString()}₮
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => selectedService && setStep(2)}
                    disabled={!selectedService}
                    className="w-full bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-3 rounded-full font-manrope font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    Үргэлжлүүлэх <ChevronRight className="inline ml-2" size={20} />
                  </button>
                </motion.div>
              )}

              {/* Step 2: Date & Time Selection */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-6">
                    Огноо Сонгох
                  </h2>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={getMinDate()}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl font-manrope mb-8 focus:border-[#C9A86A] outline-none"
                  />

                  {selectedDate && (
                    <>
                      <h3 className="font-playfair text-xl font-bold text-[#1F1F1F] mb-2 flex items-center gap-2">
                        <Clock size={20} className="text-[#C9A86A]" />
                        Цаг Сонгох
                      </h3>
                      <p className="font-manrope text-sm text-gray-500 mb-4">
                        {selectedService?.title} — {selectedService?.duration || 60} минут
                      </p>
                      {loadingSlots ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C9A86A] border-t-transparent" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
                          {availableSlots.map(({ slot, available }) => {
                            const isSelected = selectedTime === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                disabled={!available}
                                onClick={() => setSelectedTime(slot)}
                                className={`py-3 rounded-xl font-manrope text-sm font-semibold transition-all ${
                                  !available
                                    ? 'bg-gray-100 text-gray-400 line-through cursor-not-allowed'
                                    : isSelected
                                    ? 'bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white shadow-lg'
                                    : 'bg-white border-2 border-gray-200 text-[#1F1F1F] hover:border-[#C9A86A]'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {!loadingSlots && availableSlots.every((s) => !s.available) && (
                        <p className="text-sm text-amber-700 font-manrope mb-8 -mt-4">
                          Уучлаарай, энэ өдөр боломжит цаг үлдээгүй байна. Өөр өдөр сонгоно уу.
                        </p>
                      )}
                    </>
                  )}

                  <button
                    onClick={() => selectedDate && selectedTime && setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-3 rounded-full font-manrope font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    Үргэлжлүүлэх <ChevronRight className="inline ml-2" size={20} />
                  </button>
                </motion.div>
              )}

              {/* Step 3: Customer Info */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-playfair text-2xl font-bold text-[#1F1F1F] mb-6">
                    Таны Мэдээлэл
                  </h2>
                  <form className="space-y-4 mb-8">
                    <div>
                      <input
                        {...register('name')}
                        placeholder="Овог Нэр"
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl font-manrope focus:border-[#C9A86A] outline-none"
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1 font-manrope">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        {...register('phone')}
                        placeholder="Утасны Дугаар"
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl font-manrope focus:border-[#C9A86A] outline-none"
                      />
                      {errors.phone && (
                        <p className="text-red-600 text-sm mt-1 font-manrope">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>
                    <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-2xl cursor-pointer hover:border-[#C9A86A] transition-all">
                      <input
                        {...register('termsAccepted')}
                        type="checkbox"
                        className="mt-1"
                      />
                      <span className="font-manrope text-sm text-gray-700">
                        Би үйлчилгээний нөхцөлийг зөвшөөрч байна
                      </span>
                    </label>
                    {errors.termsAccepted && (
                      <p className="text-red-600 text-sm font-manrope">
                        {errors.termsAccepted.message}
                      </p>
                    )}
                  </form>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 border-2 border-gray-200 text-[#1F1F1F] py-3 rounded-full font-manrope hover:bg-gray-50 transition-all"
                    >
                      <ChevronLeft className="inline mr-2" size={20} /> Буцах
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit(onSubmit)}
                      className="flex-1 bg-gradient-to-r from-[#E8BFCF] to-[#C9A86A] text-white py-3 rounded-full font-manrope hover:shadow-lg transition-all"
                    >
                      Төлбөр Рүү Үргэлжлүүлэх <ChevronRight className="inline ml-2" size={20} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Payment Modal */}
            <AnimatePresence>
              {paymentRequired && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-md w-full"
                  >
                    <div className="flex items-center gap-3 mb-6 p-4 bg-amber-50 rounded-2xl border-2 border-amber-200">
                      <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                      <div>
                        <p className="font-manrope font-semibold text-amber-900">
                          Урьдчилгаа Төлбөр Шаардлагатай
                        </p>
                        <p className="text-sm text-amber-800 mt-1">
                          20,000₮-г эцсийн үйлчилгээний үнээс хасна
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                      <p className="font-manrope text-sm text-gray-700 mb-4">
                        <strong>Захиалгын Хураангуй:</strong>
                      </p>
                      <ul className="space-y-2 font-manrope text-sm text-gray-700 mb-4">
                        <li>Үйлчилгээ: {selectedService?.title}</li>
                        <li>Огноо: {selectedDate}</li>
                        <li>Цаг: {selectedTime}</li>
                        <li>Урьдчилгаа: 20,000₮</li>
                      </ul>
                      <p className="text-xs text-gray-600 border-t pt-3">
                        Хэрэв үйлчлүүлэгч цагтаа ирээгүй тохиолдолд урьдчилгаа төлбөрийг буцаан олгохгүй.
                      </p>
                    </div>

                    {loading && !qrImage && (
                      <div className="flex flex-col items-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C9A86A] border-t-transparent mb-3" />
                        <p className="font-manrope text-sm text-gray-600">
                          QPay нэхэмжлэл үүсгэж байна...
                        </p>
                      </div>
                    )}

                    {paymentError && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
                        <p className="text-sm text-red-800 font-manrope">{paymentError}</p>
                        <button
                          onClick={() => formData && createQpayInvoice(formData)}
                          className="mt-2 text-sm font-manrope font-semibold text-red-700 underline"
                        >
                          Дахин оролдох
                        </button>
                      </div>
                    )}

                    {qrImage && !paymentError && (
                      <div className="flex flex-col items-center mb-6">
                        <img
                          src={`data:image/png;base64,${qrImage}`}
                          alt="QPay QR код"
                          className="w-56 h-56 rounded-2xl border-2 border-gray-200 mb-4"
                        />
                        <p className="font-manrope text-sm text-gray-700 text-center mb-2">
                          Гар утасны банк аппаараа QR кодыг уншуулна уу
                        </p>
                        {qrText && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(qrText)}
                            className="text-xs text-gray-500 underline font-manrope mb-2"
                          >
                            QR кодыг текстээр хуулах
                          </button>
                        )}
                        <div className="flex items-center gap-2 text-[#C9A86A] font-manrope text-sm">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#C9A86A] border-t-transparent" />
                          {checkingPayment ? 'Төлбөр шалгаж байна...' : 'Төлбөр хүлээгдэж байна...'}
                        </div>
                        {paymentUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mt-4 w-full">
                            {paymentUrls.slice(0, 6).map((u) => (
                              <a
                                key={u.name}
                                href={u.link}
                                className="text-xs text-center py-2 px-1 border border-gray-200 rounded-xl font-manrope text-gray-700 hover:border-[#C9A86A] truncate"
                              >
                                {u.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={async () => {
                        const idToCancel = bookingId;
                        setPaymentRequired(false);
                        setQrImage(null);
                        setQrText(null);
                        setPaymentError(null);
                        setBookingId(null);
                        if (idToCancel) {
                          try {
                            await fetch('/api/qpay-cancel', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ bookingId: idToCancel }),
                            });
                          } catch (error) {
                            console.error('Error cancelling booking:', error);
                          }
                        }
                      }}
                      className="w-full border-2 border-gray-200 text-[#1F1F1F] py-3 rounded-full font-manrope hover:bg-gray-50 transition-all disabled:opacity-50"
                      disabled={loading}
                    >
                      Цуцлах
                    </button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
