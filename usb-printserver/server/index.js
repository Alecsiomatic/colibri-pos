const express = require('express');
const cors = require('cors');
const moment = require('moment-timezone');
const { printOrder, printTest, checkPrinterStatus, printTableTicket } = require('./printer');

const app = express();
const PORT = process.env.PRINT_SERVER_PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logger middleware
app.use((req, res, next) => {
  const timestamp = moment().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// RUTAS
// ============================================

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Thermal Print Server',
    version: '1.0.0',
    printer: process.env.PRINTER_IP || '192.168.100.101:9100'
  });
});

// Status de impresora
app.get('/status', async (req, res) => {
  try {
    const status = await checkPrinterStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Imprimir orden de cocina o ticket de mesa
app.post('/print', async (req, res) => {
  try {
    const data = req.body;
    const type = data.type || 'order';

    console.log(`📄 Tipo de impresión: ${type}`);
    
    let result;
    if (type === 'table-ticket') {
      // Imprimir ticket de mesa
      console.log(`🍽️  Imprimiendo ticket de mesa: ${data.tableName}`);
      result = await printTableTicket(data);
    } else {
      // Imprimir orden de cocina (default)
      console.log(`🍔 Imprimiendo orden #${data.orderId || 'N/A'}`);
      result = await printOrder(data);
    }
    
    res.json({
      success: true,
      message: type === 'table-ticket' ? 'Ticket de mesa impreso' : 'Orden impresa correctamente',
      type: type,
      timestamp: moment().tz('America/Mexico_City').format()
    });

  } catch (error) {
    console.error('❌ Error al imprimir:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
});

// Imprimir ticket de prueba
app.post('/print/test', async (req, res) => {
  try {
    console.log('🧪 Imprimiendo ticket de prueba...');
    await printTest();
    
    res.json({
      success: true,
      message: 'Ticket de prueba enviado',
      timestamp: moment().tz('America/Mexico_City').format()
    });

  } catch (error) {
    console.error('❌ Error en prueba:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🖨️  SERVIDOR DE IMPRESIÓN TÉRMICA INICIADO');
  console.log('='.repeat(50));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🖨️  Impresora: ${process.env.PRINTER_IP || '192.168.100.101:9100'}`);
  console.log(`⏰ Timezone: America/Mexico_City`);
  console.log(`🚀 Servidor listo en: http://0.0.0.0:${PORT}`);
  console.log('='.repeat(50) + '\n');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido (Ctrl+C), cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

module.exports = app;
