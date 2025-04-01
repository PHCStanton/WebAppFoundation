import React from 'react';
import Link from 'next/link';
import { formatCurrency } from '../../utils';

// Service type definition
export interface Service {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration: number | null;
}

interface ServiceCardProps {
  service: Service;
  onBookNow?: (serviceId: number) => void;
  className?: string;
}

/**
 * ServiceCard component displays a service with its details
 * and provides a booking action
 */
export function ServiceCard({ service, onBookNow, className = '' }: ServiceCardProps) {
  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow(service.id);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name}</h3>
        
        {service.description && (
          <p className="text-gray-600 mb-4">{service.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold text-primary">
            {formatCurrency(service.price)}
          </div>
          
          {service.duration && (
            <div className="text-sm text-gray-500">
              Duration: {service.duration} min
            </div>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleBookNow}
            className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded-md transition-colors"
          >
            Book Now
          </button>
          
          <Link
            href={`/services/${service.id}`}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-md text-center transition-colors"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
