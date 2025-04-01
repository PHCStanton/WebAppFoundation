import React, { useState } from 'react';
import { Service } from '../services/ServiceCard';
import { formatCurrency, formatDate } from '../../utils';

// Step types
enum BookingStep {
  SERVICE_SELECTION = 'service_selection',
  DATE_TIME_SELECTION = 'date_time_selection',
  CUSTOMER_INFO = 'customer_info',
  CONFIRMATION = 'confirmation',
}

// Available time slot type
interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

// Customer information type
interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// Booking wizard props
interface BookingWizardProps {
  services: Service[];
  onComplete: (bookingData: {
    service: Service;
    date: Date;
    timeSlot: TimeSlot;
    customerInfo: CustomerInfo;
  }) => void;
  className?: string;
}

/**
 * BookingWizard component provides a multi-step booking process
 */
export function BookingWizard({ services, onComplete, className = '' }: BookingWizardProps) {
  // State for the current step
  const [currentStep, setCurrentStep] = useState<BookingStep>(BookingStep.SERVICE_SELECTION);
  
  // State for selected service
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State for available time slots (would be fetched from API in real app)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: '1', time: '09:00 AM', available: true },
    { id: '2', time: '10:00 AM', available: true },
    { id: '3', time: '11:00 AM', available: false },
    { id: '4', time: '12:00 PM', available: true },
    { id: '5', time: '01:00 PM', available: true },
    { id: '6', time: '02:00 PM', available: true },
    { id: '7', time: '03:00 PM', available: false },
    { id: '8', time: '04:00 PM', available: true },
  ]);
  
  // State for selected time slot
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  
  // State for customer information
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  
  // Handle service selection
  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setCurrentStep(BookingStep.DATE_TIME_SELECTION);
  };
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // In a real app, you would fetch available time slots for the selected date
  };
  
  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.available) return;
    setSelectedTimeSlot(timeSlot);
    setCurrentStep(BookingStep.CUSTOMER_INFO);
  };
  
  // Handle customer info change
  const handleCustomerInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerInfo((prev) => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      return;
    }
    
    setCurrentStep(BookingStep.CONFIRMATION);
    
    // Call onComplete with booking data
    onComplete({
      service: selectedService,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      customerInfo,
    });
  };
  
  // Handle back button
  const handleBack = () => {
    switch (currentStep) {
      case BookingStep.DATE_TIME_SELECTION:
        setCurrentStep(BookingStep.SERVICE_SELECTION);
        break;
      case BookingStep.CUSTOMER_INFO:
        setCurrentStep(BookingStep.DATE_TIME_SELECTION);
        break;
      case BookingStep.CONFIRMATION:
        setCurrentStep(BookingStep.CUSTOMER_INFO);
        break;
    }
  };
  
  // Render service selection step
  const renderServiceSelection = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Select a Service</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleServiceSelect(service)}
          >
            <h3 className="text-lg font-semibold">{service.name}</h3>
            {service.description && <p className="text-gray-600 mt-2">{service.description}</p>}
            <div className="flex justify-between items-center mt-4">
              <span className="font-bold text-primary">{formatCurrency(service.price)}</span>
              {service.duration && <span className="text-sm text-gray-500">{service.duration} min</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render date and time selection step
  const renderDateTimeSelection = () => {
    // Generate dates for the next 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return date;
    });
    
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Select Date & Time</h2>
        
        {selectedService && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold">Selected Service:</h3>
            <p>{selectedService.name} - {formatCurrency(selectedService.price)}</p>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Select Date:</h3>
          <div className="flex flex-wrap gap-2">
            {dates.map((date) => (
              <button
                key={date.toISOString()}
                type="button"
                className={`px-4 py-2 rounded-md ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => handleDateSelect(date)}
              >
                {formatDate(date, 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </button>
            ))}
          </div>
        </div>
        
        {selectedDate && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Time:</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.available}
                  className={`px-4 py-2 rounded-md ${
                    !slot.available
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : selectedTimeSlot?.id === slot.id
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => handleTimeSlotSelect(slot)}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            onClick={handleBack}
          >
            Back
          </button>
          
          <button
            type="button"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed"
            disabled={!selectedDate || !selectedTimeSlot}
            onClick={() => setCurrentStep(BookingStep.CUSTOMER_INFO)}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };
  
  // Render customer information step
  const renderCustomerInfo = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6">Your Information</h2>
      
      {selectedService && selectedDate && selectedTimeSlot && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold">Booking Summary:</h3>
          <p>Service: {selectedService.name}</p>
          <p>Date: {formatDate(selectedDate)}</p>
          <p>Time: {selectedTimeSlot.time}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={customerInfo.name}
              onChange={handleCustomerInfoChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={customerInfo.email}
              onChange={handleCustomerInfoChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={customerInfo.phone}
              onChange={handleCustomerInfoChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={customerInfo.notes}
              onChange={handleCustomerInfoChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            onClick={handleBack}
          >
            Back
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md"
          >
            Complete Booking
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render confirmation step
  const renderConfirmation = () => (
    <div className="text-center">
      <div className="mb-6 text-green-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold mb-4">Booking Confirmed!</h2>
      
      <p className="text-gray-600 mb-8">
        Thank you for your booking. We have sent a confirmation email to {customerInfo.email}.
      </p>
      
      {selectedService && selectedDate && selectedTimeSlot && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
          <h3 className="font-semibold">Booking Details:</h3>
          <p>Service: {selectedService.name}</p>
          <p>Date: {formatDate(selectedDate)}</p>
          <p>Time: {selectedTimeSlot.time}</p>
          <p>Name: {customerInfo.name}</p>
          <p>Email: {customerInfo.email}</p>
          <p>Phone: {customerInfo.phone}</p>
          {customerInfo.notes && (
            <>
              <p className="font-semibold mt-2">Notes:</p>
              <p>{customerInfo.notes}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
  
  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case BookingStep.SERVICE_SELECTION:
        return renderServiceSelection();
      case BookingStep.DATE_TIME_SELECTION:
        return renderDateTimeSelection();
      case BookingStep.CUSTOMER_INFO:
        return renderCustomerInfo();
      case BookingStep.CONFIRMATION:
        return renderConfirmation();
      default:
        return null;
    }
  };
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Object.values(BookingStep).map((step, index) => (
            <div
              key={step}
              className="flex flex-col items-center"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  Object.values(BookingStep).indexOf(currentStep) >= index
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <div className="text-xs mt-1 text-center">
                {step.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-2">
          <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
          <div
            className="absolute top-0 left-0 h-1 bg-primary transition-all"
            style={{
              width: `${
                (Object.values(BookingStep).indexOf(currentStep) /
                  (Object.values(BookingStep).length - 1)) *
                100
              }%`,
            }}
          ></div>
        </div>
      </div>
      
      {/* Step content */}
      {renderStep()}
    </div>
  );
}
