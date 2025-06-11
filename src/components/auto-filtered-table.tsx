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
import { ChevronLeft, ChevronRight, Filter, MapPin, Package, ExternalLink, AlertTriangle, Info } from 'lucide-react'
import { type ProcessedOrderData } from '@/lib/excel-parser'

interface AutoFilteredTableProps {
  orders: ProcessedOrderData[]
  headers: string[]
  fileName: string
}

// Function to validate Salesforce ID format
function isValidSalesforceId(id: string): boolean {
  if (!id) return false
  // Salesforce IDs are 15 or 18 characters, alphanumeric
  const cleanId = id.trim()
  const isValid = /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(cleanId)
  console.log(`Validating Salesforce ID "${cleanId}": ${isValid}`)
  return isValid
}

// Function to handle link clicks with error handling
function handleSalesforceLink(orderSummaryId: string, orderSummaryNumber: string): void {
  if (!isValidSalesforceId(orderSummaryId)) {
    console.error(`ID do Salesforce inválido para pedido ${orderSummaryNumber}:`, orderSummaryId)
    alert(`Erro: ID do Salesforce inválido para o pedido ${orderSummaryNumber}. Verifique se você tem acesso ao sistema.`)
    return
  }
  
  const url = `https://tramontinastore--dev.sandbox.lightning.force.com/lightning/r/OrderSummary/${orderSummaryId}/view`
  console.log(`Abrindo link do Salesforce para pedido ${orderSummaryNumber}:`, url)
  
  try {
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (error) {
    console.error('Erro ao abrir link do Salesforce:', error)
    alert('Erro ao abrir o link. Verifique se você tem acesso ao Salesforce ou se está conectado à VPN.')
  }
}

export function AutoFilteredTable({ orders, headers, fileName }: AutoFilteredTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter out empty headers and get their indexes
  const meaningfulColumns = headers
    .map((header, index) => ({ header: header.trim(), index }))
    .filter(col => col.header !== '' && col.header !== null && col.header !== undefined)

  console.log('Meaningful columns:', meaningfulColumns)

  // Debug: Check Salesforce ID validity for all orders
  console.log('Validação de IDs do Salesforce:')
  orders.forEach(order => {
    const isValid = isValidSalesforceId(order.orderSummaryId)
    console.log(`Pedido ${order.orderSummaryNumber}: ID "${order.orderSummaryId}" - ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`)
  })

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
            {orders.map((order, index) => {
              const hasValidId = isValidSalesforceId(order.orderSummaryId)
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasValidId ? (
                        <button
                          onClick={() => handleSalesforceLink(order.orderSummaryId, order.orderSummaryNumber)}
                          className="font-semibold text-lg text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                        >
                          {order.orderSummaryNumber}
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{order.orderSummaryNumber}</h3>
                          <span title="ID do Salesforce inválido - link não disponível">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          </span>
                        </div>
                      )}
                      {order.orderSummaryId && (
                        <span className="text-sm text-muted-foreground">
                          ID: {order.orderSummaryId} {!hasValidId && '(inválido)'}
                        </span>
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
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Information Card about Salesforce Links */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Info className="h-5 w-5" />
            Informações sobre Links do Salesforce
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="space-y-2">
            <p><strong>✅ Links Funcionais:</strong> Pedidos com ícone <ExternalLink className="h-3 w-3 inline" /> abrem direto no Salesforce</p>
            <p><strong>⚠️ Links Indisponíveis:</strong> Pedidos com ícone <AlertTriangle className="h-3 w-3 inline text-yellow-600" /> têm ID inválido</p>
            <p><strong>🔒 Problemas de Acesso:</strong> Verifique se você está logado no Salesforce ou conectado à VPN da empresa</p>
            <p><strong>🌐 Ambiente:</strong> Links direcionam para o ambiente <code>dev.sandbox</code> do Salesforce</p>
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
                    const hasValidId = isValidSalesforceId(order.orderSummaryId)
                    return (
                      <TableRow key={startIndex + rowIndex}>
                        <TableCell className="font-medium">
                          <div className="space-y-1">
                            <div className="text-sm font-semibold">
                              {hasValidId ? (
                                <button
                                  onClick={() => handleSalesforceLink(order.orderSummaryId, order.orderSummaryNumber)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  {order.orderSummaryNumber}
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              ) : (
                                <div className="flex items-center gap-1">
                                  {order.orderSummaryNumber}
                                                                     <span title="ID do Salesforce inválido">
                                     <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                   </span>
                                </div>
                              )}
                            </div>
                            {order.orderSummaryId && (
                              <div className="text-xs text-muted-foreground">
                                ID: {order.orderSummaryId} {!hasValidId && '(inválido)'}
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