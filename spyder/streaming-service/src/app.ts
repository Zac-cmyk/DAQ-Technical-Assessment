// app.ts for the streaming service

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// IMPORTS /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

import { VehicleData, SafetyAlertMessage } from "./server";

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// VARIABLES ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

let unsafeTS: number[] = [];

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// FUNCTIONS ///////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * Validate that the data being received by the client is of the correct 
 * format. 
 * 
 * @param {VehicleData} - data about the Vehicle's battery temp & timestamp.  
 * @returns {boolean} - True or False if the data is valid or not. 
 */
export function ValidateData(data: VehicleData) {

  if (!data || typeof data !== 'object') {
    return false;
  }
  if (data.battery_temperature === undefined || data.timestamp === undefined) {
    return false;
  }

  const temp = data.battery_temperature;

  if (typeof temp !== 'number') {
    return false;
  }
  if (isNaN(temp)) {
    return false;
  }

  return true;
}

/**
 * Check if the battery temperature is outside of the safety operation range
 * 
 * @param {number} temperature - battery temperatue of the Vehicle
 * @param {number} currentTS - current timestamp of the battery temperature for the Vehicle
 * @returns {boolean} - True or False if safety is breached
 */
export function checkBatterySafety(temperature: number, currentTS: number): SafetyAlertMessage | null {
  const safeMin = 20;
  const safeMax = 80;

  if (temperature < safeMin || temperature > safeMax) {
    unsafeTS.push(currentTS);

    const fiveSecondsAgo = currentTS - 5000;
    unsafeTS = unsafeTS.filter((timestamp) => timestamp >= fiveSecondsAgo);

    if (unsafeTS.length > 3) {
      const date = new Date(currentTS);
      const formattedTime = date.toISOString(); 
          
      const alertMessage: SafetyAlertMessage = {
        type: "safety_alert",
        message: `[BATTERY SAFETY ALERT] ${formattedTime} - Battery temperature exceeded safe range (20-80°C) more than 3 times in 5 seconds.`,
        timestamp: currentTS,
        temperature,
        count: unsafeTS.length,
        duration: 5000,
      };

      unsafeTS = [];
      return alertMessage;
    }
  }

  return null;
}