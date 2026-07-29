export type Unit = {
  id: number;
  house: string;
  name: string;
  balance: number;
  totalConsumed: number;
  status: 'online' | 'offline' | 'maintenance';
  deviceId: string; // Tuya Device ID
  phoneNumber: string; // Tenant Phone Number
  bypassTimestamp?: number; // Epoch time when bypass was activated
};

// Mock in-memory database
export const unitsDB: Unit[] = [
  // House 119 - 3 meters
  { id: 1, house: 'House 119', name: 'Unit 1', balance: 14.5, totalConsumed: 1250, status: 'online', deviceId: 'dummy-device-1', phoneNumber: '+919876543210' },
  { id: 2, house: 'House 119', name: 'Unit 2', balance: 8.2, totalConsumed: 1120, status: 'online', deviceId: 'dummy-device-2', phoneNumber: '+919876543210' },
  { id: 3, house: 'House 119', name: 'Unit 3', balance: 45.0, totalConsumed: 890, status: 'online', deviceId: 'dummy-device-3', phoneNumber: '+919876543210' },
  
  // House 42 - 6 meters
  { id: 4, house: 'House 42', name: 'Unit 4', balance: 2.1, totalConsumed: 1400, status: 'online', deviceId: 'dummy-device-4', phoneNumber: '+919876543210' },
  { id: 5, house: 'House 42', name: 'Unit 5', balance: 0.0, totalConsumed: 1550, status: 'offline', deviceId: 'dummy-device-5', phoneNumber: '+919876543210' },
  { id: 6, house: 'House 42', name: 'Unit 6', balance: 120.5, totalConsumed: 600, status: 'online', deviceId: 'dummy-device-6', phoneNumber: '+919876543210' },
  { id: 7, house: 'House 42', name: 'Unit 7', balance: 34.0, totalConsumed: 950, status: 'online', deviceId: 'dummy-device-7', phoneNumber: '+919876543210' },
  { id: 8, house: 'House 42', name: 'Unit 8', balance: 18.7, totalConsumed: 1020, status: 'online', deviceId: 'dummy-device-8', phoneNumber: '+919876543210' },
  { id: 9, house: 'House 42', name: 'Unit 9', balance: 65.2, totalConsumed: 2100, status: 'online', deviceId: 'dummy-device-9', phoneNumber: '+919876543210' },
];
