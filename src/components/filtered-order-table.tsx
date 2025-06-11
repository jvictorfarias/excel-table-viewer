'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Table as TableIcon, MapPin } from 'lucide-react'
import { type ProcessedOrderData } from '@/lib/excel-parser'

interface FilteredOrderTableProps {
  orders: ProcessedOrderData[]
  headers: string[]
  fileName: string
}

export function FilteredOrderTable({ orders, headers, fileName }: FilteredOrderTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  if (!orders || orders.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No filtered data to display</p>
        </CardContent>
      </Card>
    )
  }

  // Flatten all rows from filtered orders
  const allFilteredRows: string[][] = []
  const orderInfo: { [key: number]: ProcessedOrderData } = {}
  
  orders.forEach(order => {
    order.relatedRows.forEach(row => {
      const rowIndex = allFilteredRows.length
      allFilteredRows.push(row)
      orderInfo[rowIndex] = order
    })
  })

  const totalPages = Math.ceil(allFilteredRows.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRows = allFilteredRows.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  const getOrderForRowIndex = (globalRowIndex: number): ProcessedOrderData => {
    return orderInfo[startIndex + globalRowIndex]
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          Filtered Orders - {fileName}
        </CardTitle>
        <CardDescription>
          Showing {startIndex + 1}-{Math.min(endIndex, allFilteredRows.length)} of {allFilteredRows.length} rows 
          from {orders.length} orders with multiple fulfillment locations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Order Info</TableHead>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="whitespace-nowrap">
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row, rowIndex) => {
                  const order = getOrderForRowIndex(rowIndex)
                  return (
                    <TableRow key={startIndex + rowIndex}>
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">
                            {order.orderSummaryNumber}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {order.fulfillmentLocations.map((location, locIndex) => (
                              <Badge key={locIndex} variant="outline" className="text-xs flex items-center gap-1">
                                <MapPin className="h-2 w-2" />
                                {location}
                              </Badge>
                            ))}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {order.fulfillmentCount} locations
                          </Badge>
                        </div>
                      </TableCell>
                      {headers.map((_, cellIndex) => (
                        <TableCell key={cellIndex} className="whitespace-nowrap">
                          {row[cellIndex] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 