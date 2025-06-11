'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Upload, File, X } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
  onFileRemove: () => void
}

export function FileUpload({ onFileSelect, selectedFile, onFileRemove }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const excelFile = files.find(file => 
      file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    )
    
    if (excelFile) {
      onFileSelect(excelFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Fazer Upload do Arquivo Excel
        </CardTitle>
        <CardDescription>
          Arraste seu arquivo Excel aqui ou clique para navegar. Suporta formatos .xlsx e .xls.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {selectedFile ? (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <File className="h-4 w-4" />
              <span className="text-sm font-medium">{selectedFile.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFileRemove}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">Arraste seu arquivo Excel aqui</p>
            <p className="text-sm text-muted-foreground mb-4">
              ou clique no botão abaixo para navegar
            </p>
            <div className="relative">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                Navegar Arquivos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 