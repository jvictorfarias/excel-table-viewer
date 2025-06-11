'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  processOrderData, 
  filterMultipleFulfillmentOrders, 
  autoDetectColumns,
  type ProcessedOrderData,
  type ExcelData
} from '@/lib/excel-parser'
import { Filter, MapPin, Package, AlertCircle, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface OrderFilterProps {
  excelData: ExcelData
}

export function OrderFilter({ excelData }: OrderFilterProps) {
  const [orderSummaryColumn, setOrderSummaryColumn] = useState<string>('')
  const [fulfillmentLocationColumn, setFulfillmentLocationColumn] = useState<string>('')
  const [filteredOrders, setFilteredOrders] = useState<ProcessedOrderData[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, headers = [], dataStartRow = 0 } = excelData
  const isReportFormat = (dataStartRow || 0) > 1

  // Auto-detect columns on component mount
  useEffect(() => {
    const detected = autoDetectColumns(headers)
    if (detected.orderSummaryIndex >= 0) {
      setOrderSummaryColumn(detected.orderSummaryIndex.toString())
    }
    if (detected.fulfillmentLocationIndex >= 0) {
      setFulfillmentLocationColumn(detected.fulfillmentLocationIndex.toString())
    }
  }, [headers])

  const handleFilter = () => {
    if (!orderSummaryColumn || !fulfillmentLocationColumn) {
      setError('Please select both Order Summary and Fulfillment Location columns')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const orderSummaryIndex = parseInt(orderSummaryColumn)
      const fulfillmentLocationIndex = parseInt(fulfillmentLocationColumn)

      // Process the data
      const processedOrders = processOrderData(
        data, 
        orderSummaryIndex, 
        fulfillmentLocationIndex
      )
      
      // Filter for multiple fulfillment locations
      const filtered = filterMultipleFulfillmentOrders(processedOrders)
      
      setFilteredOrders(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process data')
    } finally {
      setIsProcessing(false)
    }
  }

  const totalOrders = filteredOrders.length
  const totalRows = filteredOrders.reduce((sum, order) => sum + order.relatedRows.length, 0)

  return (
    <div className="space-y-6">
      {/* Info about the file format */}
      {isReportFormat && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Detected report format. Data starts from row {(dataStartRow || 0) + 1}. 
            The system will automatically handle orders spanning multiple rows.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Orders with Multiple Fulfillment Locations
          </CardTitle>
          <CardDescription>
            Select the columns containing Order Summary Numbers and Fulfillment Locations to filter data.
            {isReportFormat && " (Report format detected - columns auto-selected)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Order Summary Number Column</label>
              <Select value={orderSummaryColumn} onValueChange={setOrderSummaryColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {header || `Column ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fulfillment Location Column</label>
              <Select value={fulfillmentLocationColumn} onValueChange={setFulfillmentLocationColumn}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column..." />
                </SelectTrigger>
                <SelectContent>
                  {headers.map((header, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {header || `Column ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleFilter} 
            disabled={!orderSummaryColumn || !fulfillmentLocationColumn || isProcessing}
            className="w-full md:w-auto"
          >
            {isProcessing ? 'Processing...' : 'Filter Orders'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Filtered Results
            </CardTitle>
            <CardDescription>
              Found {totalOrders} orders with multiple fulfillment locations ({totalRows} total rows)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Order: {order.orderSummaryNumber}</h3>
                      <Badge variant="secondary">
                        {order.fulfillmentCount} locations
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {order.fulfillmentLocations.map((location, locIndex) => (
                      <Badge key={locIndex} variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </Badge>
                    ))}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {order.relatedRows.length} row{order.relatedRows.length !== 1 ? 's' : ''} associated with this order
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredOrders.length === 0 && !isProcessing && orderSummaryColumn && fulfillmentLocationColumn && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No orders found with multiple fulfillment locations</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 