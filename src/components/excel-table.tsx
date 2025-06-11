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
import { ChevronLeft, ChevronRight, Table as TableIcon } from 'lucide-react'

interface ExcelTableProps {
  data: string[][]
  fileName: string
}

export function ExcelTable({ data, fileName }: ExcelTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No data to display</p>
        </CardContent>
      </Card>
    )
  }

  const headers = data[0] || []
  const rows = data.slice(1)
  const totalPages = Math.ceil(rows.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRows = rows.slice(startIndex, endIndex)

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          {fileName}
        </CardTitle>
        <CardDescription>
          Showing {startIndex + 1}-{Math.min(endIndex, rows.length)} of {rows.length} rows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, index) => (
                    <TableHead key={index} className="whitespace-nowrap">
                      {header || `Column ${index + 1}`}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map((row, rowIndex) => (
                  <TableRow key={startIndex + rowIndex}>
                    {headers.map((_, cellIndex) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap">
                        {row[cellIndex] || ''}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
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