import readXlsxFile from 'read-excel-file'

export interface ExcelData {
  data: string[][]
  sheetName: string
  fileName: string
  headers?: string[]
  processedData?: ProcessedOrderData[]
  rawData?: string[][]
  dataStartRow?: number
  filteredOrders?: ProcessedOrderData[]
}

export interface ProcessedOrderData {
  orderSummaryId: string
  orderSummaryNumber: string
  fulfillmentLocations: string[]
  fulfillmentCount: number
  relatedRows: string[][]
}

export async function parseExcelFile(file: File): Promise<ExcelData> {
  try {
    console.log('Iniciando análise do arquivo Excel com a biblioteca read-excel-file...')
    
    // Use read-excel-file which is more browser-friendly and avoids compression issues
    const rows = await readXlsxFile(file)
    
    if (!rows || rows.length === 0) {
      throw new Error('Nenhum dado encontrado no arquivo Excel')
    }
    
    console.log(`Arquivo Excel analisado com sucesso com ${rows.length} linhas`)
    
    // Convert to string arrays for consistency
    const jsonData: string[][] = rows.map(row => 
      row.map(cell => cell !== null && cell !== undefined ? cell.toString() : '')
    )
    
    // Debug: Show first few rows
    console.log('Primeiras 5 linhas dos dados:')
    jsonData.slice(0, 5).forEach((row, index) => {
      console.log(`Linha ${index + 1}:`, row)
    })
    
    // Detect the report format and find headers
    const { headerRowIndex, dataStartRow } = detectHeaderLocation(jsonData)
    
    let headers: string[] = []
    let processedData: string[][] = []
    
    if (headerRowIndex >= 0) {
      headers = jsonData[headerRowIndex] || []
      processedData = jsonData.slice(dataStartRow)
    } else {
      // Fallback to standard format
      headers = jsonData[0] || []
      processedData = jsonData.slice(1)
    }
    
    // Clean headers (remove arrows and extra spaces)
    const cleanHeaders = headers.map(header => 
      header ? header.toString().replace(/[↓↑]/g, '').trim() : ''
    )
    
    console.log('Cabeçalhos detectados:', cleanHeaders)
    console.log('Dados iniciam na linha:', dataStartRow + 1)
    
    // Show first few data rows
    console.log('Primeiras 3 linhas de dados:')
    processedData.slice(0, 3).forEach((row, index) => {
      console.log(`Linha de dados ${index + 1}:`, row)
    })
    
    // Auto-process the orders
    const { orderSummaryIndex, fulfillmentLocationIndex } = autoDetectColumns(cleanHeaders)
    console.log(`Índice da coluna de pedidos: ${orderSummaryIndex}, Índice da coluna de localização: ${fulfillmentLocationIndex}`)
    
    if (orderSummaryIndex >= 0 && fulfillmentLocationIndex >= 0) {
      console.log(`Cabeçalho da coluna de pedidos: "${cleanHeaders[orderSummaryIndex]}"`)
      console.log(`Cabeçalho da coluna de localização: "${cleanHeaders[fulfillmentLocationIndex]}"`)
    }
    
    let filteredOrders: ProcessedOrderData[] = []
    if (orderSummaryIndex >= 0 && fulfillmentLocationIndex >= 0) {
      try {
        const processedOrders = processOrderData(
          processedData,
          orderSummaryIndex,
          fulfillmentLocationIndex
        )
        filteredOrders = filterMultipleFulfillmentOrders(processedOrders)
        console.log(`Encontrados ${filteredOrders.length} pedidos com múltiplas localizações`)
        
        // Debug: Show details of first few orders
        if (processedOrders.length > 0) {
          console.log('Amostra de todos os pedidos processados:')
          processedOrders.slice(0, 5).forEach(order => {
            console.log(`- Pedido ${order.orderSummaryNumber}: ${order.fulfillmentCount} localizações (${order.fulfillmentLocations.join(', ')})`)
          })
        }
        
        if (filteredOrders.length > 0) {
          console.log('Pedidos filtrados (múltiplas localizações):')
          filteredOrders.forEach(order => {
            console.log(`- Pedido ${order.orderSummaryNumber}: ${order.fulfillmentCount} localizações (${order.fulfillmentLocations.join(', ')})`)
          })
        }
      } catch (processingError) {
        console.warn('Processamento de pedidos falhou, retornando dados brutos:', processingError)
        // Continue without filtering if processing fails
      }
    } else {
      console.warn('Não foi possível detectar as colunas de pedidos ou localização')
    }
    
    return {
      data: processedData,
      sheetName: 'Sheet1', // read-excel-file doesn't provide sheet names easily
      fileName: file.name,
      headers: cleanHeaders,
      rawData: jsonData,
      dataStartRow: dataStartRow,
      filteredOrders: filteredOrders
    }
  } catch (error) {
    console.error('Erro ao analisar Excel:', error)
    
    // Provide more specific error messages
    let errorMessage = 'Falha ao analisar o arquivo Excel'
    if (error instanceof Error) {
      if (error.message.includes('Unsupported file type')) {
        errorMessage = 'Formato de arquivo Excel não suportado. Por favor, use arquivos .xlsx.'
      } else if (error.message.includes('corrupted') || error.message.includes('invalid')) {
        errorMessage = 'O arquivo Excel parece estar corrompido. Tente abrir e salvar novamente o arquivo no Excel.'
      } else {
        errorMessage = `Falha na análise do Excel: ${error.message}`
      }
    }
    
    throw new Error(errorMessage)
  }
}

function detectHeaderLocation(data: string[][]): { headerRowIndex: number, dataStartRow: number } {
  // Look for the actual headers row
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i]
    if (!row || row.length === 0) continue
    
    const rowText = row.join(' ').toLowerCase()
    
    // Look for specific header patterns
    if (rowText.includes('order summary id') && 
        rowText.includes('order summary number') && 
        rowText.includes('fulfilled location')) {
      console.log(`Cabeçalhos encontrados na linha ${i + 1}`)
      return {
        headerRowIndex: i,
        dataStartRow: i + 1
      }
    }
    
    // Alternative patterns
    if (rowText.includes('order summary') && 
        (rowText.includes('location') || rowText.includes('fulfillment'))) {
      console.log(`Cabeçalhos alternativos encontrados na linha ${i + 1}`)
      return {
        headerRowIndex: i,
        dataStartRow: i + 1
      }
    }
  }
  
  console.log('Nenhum cabeçalho específico encontrado, usando primeira linha como cabeçalhos')
  // Fallback - no proper headers found
  return { headerRowIndex: 0, dataStartRow: 1 }
}

export function processOrderData(
  data: string[][],
  orderSummaryColumnIndex: number,
  fulfillmentLocationColumnIndex: number
): ProcessedOrderData[] {
  if (!data || data.length < 1) return []
  
  console.log(`Processando ${data.length} linhas de dados`)
  console.log(`Procurando pedidos na coluna ${orderSummaryColumnIndex} e localizações na coluna ${fulfillmentLocationColumnIndex}`)
  
  const rows = data.filter(row => row && row.length > 0) // Filter empty rows
  const orderGroups = new Map<string, {
    orderSummaryId: string
    orderSummaryNumber: string
    locations: Set<string>
    rows: string[][]
  }>()
  
  let currentOrderId = ''
  let currentOrderNumber = ''
  let processedRowCount = 0
  
  // Function to validate if a string looks like a Salesforce ID
  function isValidSalesforceId(id: string): boolean {
    if (!id) return false
    const cleanId = id.trim()
    // Salesforce IDs are 15 or 18 characters, alphanumeric, case-sensitive
    return /^[a-zA-Z0-9]{15}$|^[a-zA-Z0-9]{18}$/.test(cleanId)
  }
  
  // Function to find the best Order Summary ID candidate
  function findOrderSummaryId(row: string[], orderSummaryColumnIndex: number): string {
    // Check multiple potential columns for Order Summary ID
    const candidates = []
    
    // Try column before Order Summary Number (common pattern)
    if (orderSummaryColumnIndex > 0) {
      candidates.push(row[orderSummaryColumnIndex - 1])
    }
    
    // Try first column (sometimes Order Summary ID is in column 0)
    if (row[0]) {
      candidates.push(row[0])
    }
    
    // Try column after Order Summary Number (alternative pattern)
    if (orderSummaryColumnIndex + 1 < row.length) {
      candidates.push(row[orderSummaryColumnIndex + 1])
    }
    
    // Find the first valid Salesforce ID
    for (const candidate of candidates) {
      if (candidate && isValidSalesforceId(candidate.toString().trim())) {
        return candidate.toString().trim()
      }
    }
    
    // If no valid ID found, return the original candidate (column before Order Summary Number)
    if (orderSummaryColumnIndex > 0 && row[orderSummaryColumnIndex - 1]) {
      return row[orderSummaryColumnIndex - 1].toString().trim()
    }
    
    return ''
  }
  
  rows.forEach((row) => {
    // Ensure row has enough columns
    if (row.length <= Math.max(orderSummaryColumnIndex, fulfillmentLocationColumnIndex)) {
      return // Skip rows that don't have enough columns
    }
    
    // Get Order Summary Number (main identifier)
    let orderSummaryNumber = row[orderSummaryColumnIndex]?.toString().trim()
    let orderSummaryId = findOrderSummaryId(row, orderSummaryColumnIndex)
    
    const fulfillmentLocation = row[fulfillmentLocationColumnIndex]?.toString().trim()
    
    // Debug: Show first few processed rows
    if (processedRowCount < 10) {
      console.log(`Processando linha ${processedRowCount + 1}:`)
      console.log(`  Número do Resumo do Pedido (col ${orderSummaryColumnIndex}): "${orderSummaryNumber}"`)
      console.log(`  ID do Resumo do Pedido: "${orderSummaryId}" (${isValidSalesforceId(orderSummaryId) ? 'VÁLIDO' : 'INVÁLIDO'})`)
      console.log(`  Local de Atendimento (col ${fulfillmentLocationColumnIndex}): "${fulfillmentLocation}"`)
    }
    
    // If we have a new order number, update current tracking
    if (orderSummaryNumber) {
      currentOrderNumber = orderSummaryNumber
      if (orderSummaryId) {
        currentOrderId = orderSummaryId
      }
      if (processedRowCount < 10) {
        console.log(`  Novo pedido detectado: ${orderSummaryNumber}`)
      }
    } else if (currentOrderNumber) {
      // Use current order for continuation rows
      orderSummaryNumber = currentOrderNumber
      orderSummaryId = currentOrderId
      if (processedRowCount < 10) {
        console.log(`  Linha de continuação para o pedido: ${orderSummaryNumber}`)
      }
    }
    
    // Only process rows that have both order and location
    if (orderSummaryNumber && fulfillmentLocation) {
      if (!orderGroups.has(orderSummaryNumber)) {
        orderGroups.set(orderSummaryNumber, {
          orderSummaryId: orderSummaryId,
          orderSummaryNumber: orderSummaryNumber,
          locations: new Set(),
          rows: []
        })
        if (processedRowCount < 10) {
          console.log(`  Criado novo grupo de pedidos para: ${orderSummaryNumber}`)
        }
      }
      
      const orderGroup = orderGroups.get(orderSummaryNumber)!
      orderGroup.locations.add(fulfillmentLocation)
      orderGroup.rows.push(row)
      
      if (processedRowCount < 10) {
        console.log(`  Adicionada localização "${fulfillmentLocation}" ao pedido ${orderSummaryNumber}`)
        console.log(`  Pedido agora tem ${orderGroup.locations.size} localizações únicas`)
      }
      
      // Update ID if we have a better one
      if (orderSummaryId && (isValidSalesforceId(orderSummaryId) || !orderGroup.orderSummaryId)) {
        orderGroup.orderSummaryId = orderSummaryId
      }
    } else {
      if (processedRowCount < 10) {
        console.log(`  Linha ignorada - faltando pedido (${!!orderSummaryNumber}) ou localização (${!!fulfillmentLocation})`)
      }
    }
    
    processedRowCount++
  })
  
  console.log(`Encontrados ${orderGroups.size} pedidos únicos`)
  
  // Debug: Show order statistics with ID validation
  const orderStats = Array.from(orderGroups.entries()).map(([orderNumber, group]) => ({
    orderNumber,
    orderSummaryId: group.orderSummaryId,
    isValidId: isValidSalesforceId(group.orderSummaryId),
    locationCount: group.locations.size,
    locations: Array.from(group.locations)
  }))
  
  console.log('Estatísticas dos pedidos:')
  orderStats.forEach(stat => {
    console.log(`- ${stat.orderNumber} (ID: ${stat.orderSummaryId || 'N/A'} - ${stat.isValidId ? 'VÁLIDO' : 'INVÁLIDO'}): ${stat.locationCount} localizações (${stat.locations.join(', ')})`)
  })
  
  // Convert to ProcessedOrderData format
  const processedOrders: ProcessedOrderData[] = []
  
  orderGroups.forEach((orderGroup) => {
    processedOrders.push({
      orderSummaryId: orderGroup.orderSummaryId,
      orderSummaryNumber: orderGroup.orderSummaryNumber,
      fulfillmentLocations: Array.from(orderGroup.locations),
      fulfillmentCount: orderGroup.locations.size,
      relatedRows: orderGroup.rows
    })
  })
  
  return processedOrders
}

export function filterMultipleFulfillmentOrders(processedOrders: ProcessedOrderData[]): ProcessedOrderData[] {
  const filtered = processedOrders.filter(order => order.fulfillmentCount > 1)
  console.log(`Filtrados para ${filtered.length} pedidos com múltiplos locais de atendimento`)
  
  if (filtered.length === 0 && processedOrders.length > 0) {
    console.log('DEBUG: Nenhum pedido com múltiplas localizações encontrado. Contagens de localização de todos os pedidos:')
    processedOrders.forEach(order => {
      console.log(`  ${order.orderSummaryNumber}: ${order.fulfillmentCount} localização(ões)`)
    })
  }
  
  return filtered
}

export function getColumnIndex(headers: string[], columnName: string): number {
  return headers.findIndex(header => 
    header && header.toLowerCase().includes(columnName.toLowerCase())
  )
}

export function autoDetectColumns(headers: string[]): {
  orderSummaryIndex: number
  fulfillmentLocationIndex: number
} {
  console.log('Auto-detectando colunas dos cabeçalhos:', headers)
  console.log('Cabeçalhos com índices:')
  headers.forEach((header, index) => {
    console.log(`  [${index}]: "${header}"`)
  })
  
  // Based on your file structure, we know the correct positions:
  // Column 1: Order Summary ID (index 1)
  // Column 2: Order Summary Number (index 2) 
  // Column 3: Fulfilled Location (index 3)
  
  let orderSummaryIndex = -1
  let fulfillmentLocationIndex = -1
  
  // Try to find Order Summary Number column (should be index 2)
  if (headers.length > 2 && headers[2] && headers[2].toLowerCase().includes('order summary number')) {
    orderSummaryIndex = 2
    console.log('Número do Resumo do Pedido encontrado no índice 2:', headers[2])
  } else {
    // Look for any column containing "order summary number"
    orderSummaryIndex = headers.findIndex(header => 
      header && header.toLowerCase().includes('order summary number')
    )
    if (orderSummaryIndex >= 0) {
      console.log(`Número do Resumo do Pedido encontrado no índice ${orderSummaryIndex}:`, headers[orderSummaryIndex])
    }
  }
  
  // Try to find Fulfillment Location column (should be index 3)
  if (headers.length > 3 && headers[3] && headers[3].toLowerCase().includes('location')) {
    fulfillmentLocationIndex = 3
    console.log('Local de Atendimento encontrado no índice 3:', headers[3])
  } else {
    // Look for any column containing "location"
    fulfillmentLocationIndex = headers.findIndex(header => 
      header && (
        header.toLowerCase().includes('fulfilled location') ||
        header.toLowerCase().includes('fulfillment location') ||
        header.toLowerCase().includes('location name') ||
        header.toLowerCase().includes('location')
      )
    )
    if (fulfillmentLocationIndex >= 0) {
      console.log(`Coluna de localização encontrada no índice ${fulfillmentLocationIndex}:`, headers[fulfillmentLocationIndex])
    }
  }
  
  // Fallback: if still not found, use known positions for your file format
  if (orderSummaryIndex === -1 && headers.length > 2) {
    orderSummaryIndex = 2  // Default to column 2 for Order Summary Number
    console.log('Fallback: Usando índice 2 para Número do Resumo do Pedido')
  }
  
  if (fulfillmentLocationIndex === -1 && headers.length > 3) {
    fulfillmentLocationIndex = 3  // Default to column 3 for Location
    console.log('Fallback: Usando índice 3 para Local de Atendimento')
  }
  
  console.log(`Detecção final de colunas - Número do Resumo do Pedido: ${orderSummaryIndex}, Local de Atendimento: ${fulfillmentLocationIndex}`)
  
  if (orderSummaryIndex >= 0 && fulfillmentLocationIndex >= 0) {
    console.log(`Usará as colunas:`)
    console.log(`  Número do Resumo do Pedido (${orderSummaryIndex}): "${headers[orderSummaryIndex] || 'N/A'}"`)
    console.log(`  Local de Atendimento (${fulfillmentLocationIndex}): "${headers[fulfillmentLocationIndex] || 'N/A'}"`)
  } else {
    console.warn('Não foi possível detectar as colunas necessárias!')
    console.warn(`Índice do Resumo do Pedido: ${orderSummaryIndex}`)
    console.warn(`Índice do Local de Atendimento: ${fulfillmentLocationIndex}`)
  }
  
  return {
    orderSummaryIndex,
    fulfillmentLocationIndex
  }
}

export function validateExcelFile(file: File): boolean {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ]
  
  const validExtensions = ['.xlsx', '.xls']
  
  return (
    validTypes.includes(file.type) ||
    validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
  )
} 