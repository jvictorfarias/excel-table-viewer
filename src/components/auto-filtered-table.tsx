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
import { ChevronLeft, ChevronRight, Filter, MapPin, Package } from 'lucide-react'
import { type ProcessedOrderData } from '@/lib/excel-parser'

interface AutoFilteredTableProps {
  orders: ProcessedOrderData[]
  headers: string[]
  fileName: string
}

export function AutoFilteredTable({ orders, headers, fileName }: AutoFilteredTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter out empty headers and get their indexes
  const meaningfulColumns = headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter(col => col.header !== '' && col.header !== null && col.header !== undefined)

  console.log('Meaningful columns:', meaningfulColumns)

  if (!orders || orders.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Nenhum Pedido com Múltiplas Localizações Encontrado
          </CardTitle>
          <CardDescription>
            Nenhum pedido com múltiplos locais de atendimento foi encontrado neste arquivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">
            Todos os pedidos neste arquivo têm apenas um local de atendimento.
          </p>
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
    <div className="space-y-6">
      {/* Summary Card - List Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Pedidos com Múltiplos Locais de Atendimento
          </CardTitle>
          <CardDescription>
            Encontrados {orders.length} pedidos com múltiplos locais de atendimento ({allFilteredRows.length} total de linhas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((order, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {order.orderSummaryId ? (
                      <a
                        href={`https://tramontinastore--dev.sandbox.lightning.force.com/lightning/r/OrderSummary/${order.orderSummaryId}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                      >
                        {order.orderSummaryNumber}
                      </a>
                    ) : (
                      <h3 className="font-semibold text-lg">{order.orderSummaryNumber}</h3>
                    )}
                    {order.orderSummaryId && (
                      <span className="text-sm text-muted-foreground">ID: {order.orderSummaryId}</span>
                    )}
                    <Badge variant="secondary">
                      {order.fulfillmentCount} locais
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Locais de Atendimento:</p>
                  <div className="flex flex-wrap gap-2">
                    {order.fulfillmentLocations.map((location, locIndex) => (
                      <Badge key={locIndex} variant="outline" className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {order.relatedRows.length} linha{order.relatedRows.length !== 1 ? 's' : ''} no conjunto de dados
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Dados Detalhados - {fileName}
          </CardTitle>
          <CardDescription>
            Mostrando {startIndex + 1}-{Math.min(endIndex, allFilteredRows.length)} de {allFilteredRows.length} linhas 
            de pedidos com múltiplos locais de atendimento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Informações do Pedido</TableHead>
                    {meaningfulColumns.map((col, index) => (
                      <TableHead key={index} className="whitespace-nowrap">
                        {col.header}
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
                              {order.orderSummaryId ? (
                                <a
                                  href={`https://tramontinastore--dev.sandbox.lightning.force.com/lightning/r/OrderSummary/${order.orderSummaryId}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                >
                                  {order.orderSummaryNumber}
                                </a>
                              ) : (
                                order.orderSummaryNumber
                              )}
                            </div>
                            {order.orderSummaryId && (
                              <div className="text-xs text-muted-foreground">
                                ID: {order.orderSummaryId}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1">
                              {order.fulfillmentLocations.map((location, locIndex) => (
                                <Badge key={locIndex} variant="outline" className="text-xs flex items-center gap-1">
                                  <MapPin className="h-2 w-2" />
                                  {location}
                                </Badge>
                              ))}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {order.fulfillmentCount} locais
                            </Badge>
                          </div>
                        </TableCell>
                        {meaningfulColumns.map((col, cellIndex) => (
                          <TableCell key={cellIndex} className="whitespace-nowrap">
                            {row[col.index] || ''}
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
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 