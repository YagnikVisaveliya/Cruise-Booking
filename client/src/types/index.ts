export interface PassengerInput {
  type: 'adult' | 'child';
  age: number;
}

export interface Cruise {
  id: number;
  cruise_line: string;
  ship_name: string;
  destination: string;
  nights: number;
  adult_fare: number;
  capacity_total: number;
  capacity_left: number;
  image_url?: string;
}

export interface PassengerPriceBreakdown {
  passenger_type: 'adult' | 'child';
  age: number;
  base_fare: number;
  child_discount_percentage: number;
  child_discount_amount: number;
  charged_fare: number;
}

export interface ServicePriceBreakdown {
  service_id: string;
  service_name: string;
  unit_price: number;
  pricing_unit: string;
  quantity: number;
  total_charged: number;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount: number;
  rejection_reason?: string;
}

export interface PriceCalculationResponse {
  cruise: {
    id: number;
    cruise_line: string;
    ship_name: string;
    destination: string;
    nights: number;
    adult_fare: number;
  };
  total_passengers: number;
  adult_count: number;
  child_count: number;
  passengers_breakdown: PassengerPriceBreakdown[];
  gross_cruise_fare: number;
  group_discount_tier: {
    min_pax: number;
    max_pax: number;
    percentage: number;
  };
  group_discount_amount: number;
  net_cruise_fare: number;
  selected_services_breakdown: ServicePriceBreakdown[];
  optional_services_total: number;
  subtotal_before_promo: number;
  promo: PromoValidationResult;
  net_payable_before_tax: number;
  tax_rate_percentage: number;
  tax_amount: number;
  total_amount_charged: number;
}

export interface HistoricBookingResponse {
  booking_reference: string;
  created_at: string;
  status: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  cruise: {
    cruise_line: string;
    ship_name: string;
    destination: string;
    nights: number;
    adult_fare_at_booking: number;
  };
  breakdown: {
    total_passengers: number;
    adult_count: number;
    child_count: number;
    gross_cruise_fare: number;
    group_discount_percentage: number;
    group_discount_amount: number;
    net_cruise_fare: number;
    optional_services_total: number;
    subtotal_before_promo: number;
    promo_code?: string;
    promo_discount_amount: number;
    net_payable_before_tax: number;
    tax_rate_percentage: number;
    tax_amount: number;
    total_amount_charged: number;
  };
  passenger_snapshots: Array<{
    passenger_type: string;
    age: number;
    base_fare_snapshot: number;
    child_discount_percentage: number;
    charged_fare: number;
  }>;
  service_snapshots: Array<{
    service_id: string;
    service_name: string;
    unit_price: number;
    quantity: number;
    total_charged: number;
  }>;
}
