"use client"

import { useState, useEffect } from "react"
import useWebSocket, { ReadyState } from "react-use-websocket"
import { useTheme } from "next-themes"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Thermometer, History, AlertTriangle, Battery, Activity, Gauge, Calendar } from "lucide-react"
import RedbackLogoDarkMode from "../../public/logo-darkmode.svg"

const WS_URL = "ws://localhost:8080"

interface VehicleData {
  battery_temperature: number
  timestamp: number
}

interface SafetyAlertMessage {
  type: "safety_alert"
  message: string
  timestamp: number
  temperature: number
  count: number
  duration: number
}

interface HistoryDataPoint {
  temperature: number
  timestamp: number
  time: string
}


const getTemperatureColor = (temp: number): string => {
  if (temp < 20 || temp > 80) return "text-red-500"
  if (temp < 25 || temp > 75) return "text-yellow-500"
  return "text-green-500"
}

const getTemperatureBarColor = (temp: number): string => {
  if (temp < 20 || temp > 80) return "bg-red-500"
  if (temp < 25 || temp > 75) return "bg-yellow-500"
  return "bg-green-500"
}

export default function Page(): JSX.Element {
  const { setTheme } = useTheme()
  const [temperature, setTemperature] = useState<number>(0)
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected")
  const [history, setHistory] = useState<HistoryDataPoint[]>([])
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlertMessage[]>([])
  const [maxTemp, setMaxTemp] = useState<number>(80)
  const [minTemp, setMinTemp] = useState<number>(20)

  const { lastJsonMessage, readyState } = useWebSocket<VehicleData>(WS_URL, {
    share: false,
    shouldReconnect: () => true,
  })

  useEffect(() => {
    switch (readyState) {
      case ReadyState.OPEN:
        setConnectionStatus("Connected")
        break
      case ReadyState.CLOSED:
        setConnectionStatus("Disconnected")
        break
      case ReadyState.CONNECTING:
        setConnectionStatus("Connecting")
        break
      default:
        setConnectionStatus("Disconnected")
        break
    }
  }, [readyState])

  useEffect(() => {
    if (!lastJsonMessage) return
    const message = lastJsonMessage

    if ('battery_temperature' in message && 'timestamp' in message) {
      const newTemp = message.battery_temperature
      setTemperature(newTemp)

      const newHistoryPoint: HistoryDataPoint = {
        temperature: newTemp,
        timestamp: message.timestamp,
        time: new Date(message.timestamp).toLocaleTimeString(),
      }

      setHistory((prev) => [...prev, newHistoryPoint].slice(-50))

    } 
    else if ('message' in message && 'temperature' in message) {
      setSafetyAlerts((prev) => [...prev, message].slice(-20))
    }

  }, [lastJsonMessage])

  useEffect(() => {
    setTheme("dark")
  }, [setTheme])

  const tempPercentage = Math.max(0, Math.min(100, ((temperature - minTemp) / (maxTemp - minTemp)) * 100))
  const safePercentage = Math.max(0, Math.min(100, ((temperature - 20) / (80 - 20)) * 100))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 h-20 flex items-center gap-5 border-b border-border">
        <Image
          src={RedbackLogoDarkMode}
          className="h-12 w-auto"
          alt="Redback Racing Logo"
        />
        <h1 className="text-foreground text-xl font-semibold">DAQ Technical Assessment</h1>
        <Badge
          variant={connectionStatus === "Connected" ? "success" : "destructive"}
          className="ml-auto"
        >
          {connectionStatus}
        </Badge>
      </header>

      <main className="flex-grow p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Temperature Panel*/}
        <Card className="lg:col-span-2 border-2 border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold flex items-center gap-3">
              <Thermometer className="h-7 w-7 text-red-400" />
              Battery Temperature Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Temperature Value with Status */}
            <div className="text-center p-6 bg-muted/50 rounded-lg border border-border">
              <div className={`text-6xl font-bold ${getTemperatureColor(temperature)} mb-2`}>
                {temperature.toFixed(3)}°C
              </div>
              <div className="text-lg font-medium">
                {temperature < 20 || temperature > 80 ? (
                  <span className="text-red-500 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    CRITICAL - Unsafe Operating Range
                  </span>
                ) : temperature < 25 || temperature > 75 ? (
                  <span className="text-yellow-500 flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    WARNING - Approaching Limits
                  </span>
                ) : (
                  <span className="text-green-500 flex items-center justify-center gap-2">
                    ✓ Safe Operating Range
                  </span>
                )}
              </div>
            </div>

            {/* Temperature Bar */}
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">Temperature Scale</span>
                <span className="text-sm text-muted-foreground">
                  {minTemp.toFixed(0)}°C - {maxTemp.toFixed(0)}°C
                </span>
              </div>
              
              <div className="w-full h-8 bg-secondary rounded-full relative overflow-hidden border border-border">
                <div
                  className={`h-full ${getTemperatureBarColor(temperature)} transition-all duration-500 ease-out`}
                  style={{ width: `${tempPercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-background mix-blend-difference">
                    Current: {temperature.toFixed(1)}°C
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mt-4 text-xs">
                <div className="text-center text-red-500 font-medium">Critical<br/>&lt;20°C</div>
                <div className="text-center text-yellow-500">Warning<br/>20-25°C</div>
                <div className="text-center text-green-500 font-medium">Safe<br/>25-75°C</div>
                <div className="text-center text-yellow-500">Warning<br/>75-80°C</div>
                <div className="text-center text-red-500 font-medium">Critical<br/>&gt;80°C</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Status Panel */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Activity className="h-6 w-6 text-red-400" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="text-2xl font-bold text-green-400">{history.length}</div>
                <div className="text-sm text-muted-foreground">Data Points (max. 50) </div>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="text-2xl font-bold text-white-400">500ms</div>
                <div className="text-sm text-muted-foreground">Update Rate</div>
              </div>
            </div>
            
            {/* Connection Box */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Connection</span>
                <Badge variant={connectionStatus === "Connected" ? "success" : "destructive"}>
                  {connectionStatus}
                </Badge>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full">
                <div 
                  className={`h-full ${connectionStatus === "Connected" ? "bg-green-500" : "bg-red-500"} rounded-full transition-all`}
                  style={{ width: connectionStatus === "Connected" ? '100%' : '0%' }}
                />
              </div>

              {/* Data History */}
              <div className="mt-4 h-48 overflow-y-auto border-t border-border pt-2">
                {history.slice(-10).reverse().map((point, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                    <span className="text-sm text-muted-foreground">{point.time}</span>
                    <span className={`font-mono ${getTemperatureColor(point.temperature)}`}>
                      {point.temperature.toFixed(1)}°C
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Panel */}
        <Card className="border-2 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Gauge className="h-6 w-6 text-red-400" />
              Temperature Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Current", value: temperature, color: getTemperatureColor(temperature) },
              { label: "Maximum", value: Math.max(...history.map(h => h.temperature), temperature), color: "text-orange-400" },
              { label: "Minimum", value: Math.min(...history.map(h => h.temperature), temperature), color: "text-blue-400" },
              { label: "Average", value: history.reduce((sum, h) => sum + h.temperature, 0) / Math.max(1, history.length), color: "text-purple-400" }
            ].map((stat, index) => (
              <div key={index} className="bg-muted/50 p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{stat.label}</span>
                  <span className={`text-xl font-bold ${stat.color}`}>
                    {stat.value.toFixed(3)}°C
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        

         {/* Battery Health Panel */}
        <Card className="border-2 border-border lg:col-span-2 mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Battery className="h-6 w-6 text-red-400" />
              Battery Health & Safety
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Safe operating range bar */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Safe Operating Range</span>
                <span className="text-sm text-muted-foreground">{safePercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-secondary h-3 rounded-full">
                <div
                  className={`h-full ${getTemperatureBarColor(temperature)} transition-all duration-500`}
                  style={{ width: `${safePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>20°C</span>
                <span>80°C</span>
              </div>
            </div>

            {/* Safety Alerts Log */}
            <div className="bg-muted/50 p-4 rounded-lg border border-border h-48 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Safety Alerts
                </span>
                {safetyAlerts.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">{safetyAlerts.length} Active</Badge>
                )}
              </div>

              {safetyAlerts.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  No safety alerts
                </div>
              ) : (
                <ul className="space-y-2">
                  {safetyAlerts.slice().reverse().map((alert, index) => (
                    <li key={index} className="bg-red-100 dark:bg-red-900/30 rounded p-2 border border-red-300 dark:border-red-700">
                      <div className="text-xs font-semibold text-red-700 dark:text-red-300">{alert.message}</div>
                      <div className="text-xs text-muted-foreground">
                        Temp: {alert.temperature.toFixed(1)}°C • Count: {alert.count} • {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  )
}