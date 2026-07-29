import { TuyaContext } from '@tuya/tuya-connector-nodejs';

// Use environment variables for production, dummy values for now
const TUYA_ACCESS_ID = process.env.TUYA_ACCESS_ID || 'dummy-access-id';
const TUYA_ACCESS_SECRET = process.env.TUYA_ACCESS_SECRET || 'dummy-access-secret';

// Using the India endpoint as recommended
const tuya = new TuyaContext({
  baseUrl: 'https://openapi.tuya.in',
  accessKey: TUYA_ACCESS_ID,
  secretKey: TUYA_ACCESS_SECRET,
});

/**
 * Gets the current energy reading from a Tuya Smart MCB.
 * For dummy testing, it returns a random small consumption value.
 */
export async function getEnergyReading(deviceId: string): Promise<number> {
  if (TUYA_ACCESS_ID === 'dummy-access-id') {
    // Mock logic: Simulate 0.05 to 0.15 kWh consumed since last check
    console.log(`[TUYA MOCK] Getting reading for device ${deviceId}`);
    return Number((Math.random() * 0.1 + 0.05).toFixed(2));
  }

  try {
    // Official Tuya API call to get device status (e.g., energy reading)
    // Note: The exact command code depends on the specific MCB model.
    // 'add_ele' is a common code for cumulative energy in Tuya smart meters.
    const response = await tuya.request({
      path: `/v1.0/iot-03/devices/${deviceId}/status`,
      method: 'GET',
    });
    
    // Parse the response to find the energy value
    const statusArray = response.result;
    const energyItem = statusArray?.find((item: any) => item.code === 'add_ele');
    
    // Tuya often returns energy in multiples of 10 or 1000, assuming direct kWh here
    return energyItem ? Number(energyItem.value) / 1000 : 0; 
  } catch (error) {
    console.error(`[TUYA] Error fetching reading for ${deviceId}:`, error);
    return 0;
  }
}

/**
 * Turns the relay of the Smart MCB ON or OFF.
 * For dummy testing, it just logs to the console.
 */
export async function setRelayStatus(deviceId: string, turnOn: boolean): Promise<boolean> {
  if (TUYA_ACCESS_ID === 'dummy-access-id') {
    // Mock logic
    console.log(`[TUYA MOCK] Setting relay for device ${deviceId} to ${turnOn ? 'ON' : 'OFF'}`);
    return true;
  }

  try {
    // Official Tuya API call to send command (switch_1 is standard for relays)
    await tuya.request({
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      method: 'POST',
      body: {
        commands: [
          {
            code: 'switch_1',
            value: turnOn
          }
        ]
      }
    });
    return true;
  } catch (error) {
    console.error(`[TUYA] Error setting relay for ${deviceId}:`, error);
    return false;
  }
}
