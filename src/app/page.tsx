'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/file-upload'
import { AutoFilteredTable } from '@/components/auto-filtered-table'
import { parseExcelFile, validateExcelFile, type ExcelData } from '@/lib/excel-parser'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileSpreadsheet, Info } from 'lucide-react'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [excelData, setExcelData] = useState<ExcelData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    
    if (!validateExcelFile(file)) {
      setError('Por favor, selecione um arquivo Excel válido (.xlsx ou .xls)')
      return
    }

    setSelectedFile(file)
    setIsLoading(true)

    try {
      const data = await parseExcelFile(file)
      setExcelData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao processar o arquivo Excel')
      setExcelData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileRemove = () => {
    setSelectedFile(null)
    setExcelData(null)
    setError(null)
  }

  const handleProcessFile = () => {
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">Analisador de Atendimento de Pedidos</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Faça upload dos seus arquivos Excel para identificar automaticamente pedidos com múltiplos locais de atendimento
            </p>
          </div>

          {/* File Upload */}
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            onFileRemove={handleFileRemove}
          />

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processando arquivo Excel e filtrando pedidos...</span>
              </div>
            </div>
          )}

          {/* Process Button (for files that were selected but not auto-processed) */}
          {selectedFile && !excelData && !isLoading && !error && (
            <div className="flex justify-center">
              <Button onClick={handleProcessFile} size="lg">
                Processar Arquivo Excel
              </Button>
            </div>
          )}

          {/* Processing Information */}
          {excelData && !isLoading && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Arquivo processado com sucesso. Mostrando apenas pedidos com múltiplos locais de atendimento.
                {excelData.dataStartRow && ` Dados detectados a partir da linha ${excelData.dataStartRow + 1}.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Filtered Results */}
          {excelData && excelData.filteredOrders && excelData.headers && !isLoading && (
            <AutoFilteredTable
              orders={excelData.filteredOrders}
              headers={excelData.headers}
              fileName={excelData.fileName}
            />
          )}
        </div>
      </div>
    </main>
  )
}
