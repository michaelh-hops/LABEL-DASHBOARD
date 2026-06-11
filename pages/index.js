import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const SEED = {
  summary: { total_orders: 22, gross_revenue: 3732, total_units: 14 },
  products: [
    { title: 'TRACK JACKET', units: 6, revenue: 1225 },
    { title: 'LONG SLEEVE T', units: 6, revenue: 630 },
    { title: 'SAUNA HAT', units: 7, revenue: 480 },
    { title: 'The LOS YORK Global Nomads 25 Tote', units: 4, revenue: 418 },
    { title: 'LOS YORK Global Nomads hat', units: 4, revenue: 266 },
    { title: 'LOS YORK Pixels Socks', units: 4, revenue: 70 },
    { title: 'Los York Global Nomads T-shirt', units: 1, revenue: 55 },
    { title: 'LOS YORK Camera Club Tee', units: 1, revenue: 50 },
  ],
  referrers: [
    { source: 'Direct', orders: 14, revenue: 60 },
    { source: 'Search', orders: 5, revenue: 65 },
    { source: 'Social', orders: 3, revenue: 200 },
  ],
  inventory: {
    low_stock: [
      { title: 'LY hat', variant: '', units: 3 },
      { title: 'LOS YORK CITIZEN HEAVYWEIGHT HOODIE', variant: 'S', units: 2 },
      { title: 'Citizens Circle: Radu Pose', variant: 'S', units: 3 },
      { title: 'Ball Park Stickers', variant: '', units: 4 },
      { title: 'LOS YORK Pixels Hoodie', variant: 'S', units: 5 },
    ],
    most_moved: [
      { title: 'SAUNA HAT', variant: '', units_sold: 8, remaining: 133 },
      { title: 'LOS YORK Global Nomads hat', variant: '', units_sold: 6, remaining: 24 },
      { title: 'The LOS YORK Global Nomads 25 Tote', variant: '', units_sold: 5, remaining: 45 },
      { title: 'LOS YORK Pixels Socks', variant: '', units_sold: 4, remaining: 293 },
      { title: 'TRACK JACKET', variant: 'M', units_sold: 2, remaining: 33 },
    ],
  },
  updated_at: new Date().toISOString(),
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function timeAgo(iso) {
  if (!iso) return '—';
  const
