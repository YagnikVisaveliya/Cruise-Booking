import axios from 'axios';
import { Cruise, PriceCalculationResponse, HistoricBookingResponse, PassengerInput } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function fetchCruises(): Promise<Cruise[]> {
  const res = await apiClient.get('/cruises');
  if (!res.data.success) {
    throw new Error(res.data.message || 'Failed to fetch cruises.');
  }
  return res.data.data;
}

export async function calculatePricing(payload: {
  cruise_id: number | string;
  passengers: PassengerInput[];
  selected_services?: string[];
  promo_code?: string;
  customer_email?: string;
}): Promise<PriceCalculationResponse> {
  try {
    const res = await apiClient.post('/quotes', payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to calculate price.');
    }
    return res.data.data;
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0] || err.response?.data?.message || err.message || 'Failed to calculate price.';
    throw new Error(msg);
  }
}

export async function createBooking(payload: {
  cruise_id: number | string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  passengers: PassengerInput[];
  selected_services?: string[];
  promo_code?: string;
}): Promise<HistoricBookingResponse> {
  try {
    const res = await apiClient.post('/bookings', payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to create booking.');
    }
    return res.data.data;
  } catch (err: any) {
    const msg = err.response?.data?.errors?.[0] || err.response?.data?.message || err.message || 'Failed to create booking.';
    throw new Error(msg);
  }
}

export async function lookupBooking(reference: string): Promise<HistoricBookingResponse> {
  try {
    const res = await apiClient.get(`/bookings/${encodeURIComponent(reference)}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Booking reference not found.');
    }
    return res.data.data;
  } catch (err: any) {
    const msg = err.response?.data?.message || err.message || 'Booking reference not found.';
    throw new Error(msg);
  }
}
