const escpos = require('escpos');
const Network = require('escpos-network');
const moment = require('moment-timezone');

// Configuración de impresora desde variables de entorno
const PRINTER_IP = process.env.PRINTER_IP || '192.168.100.101';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100');

// Configuración ESC/POS
escpos.Network = Network;

/**
 * Obtener dispositivo de impresora
 */
function getPrinterDevice() {
  return new Network(PRINTER_IP, PRINTER_PORT);
}

/**
 * Verificar estado de la impresora
 */
async function checkPrinterStatus() {
  return new Promise((resolve, reject) => {
    const device = getPrinterDevice();
    
    device.open((error) => {
      if (error) {
        resolve({
          status: 'offline',
          printer: `${PRINTER_IP}:${PRINTER_PORT}`,
          connected: false,
          error: error.message
        });
      } else {
        device.close();
        resolve({
          status: 'online',
          printer: `${PRINTER_IP}:${PRINTER_PORT}`,
          connected: true
        });
      }
    });
  });
}

/**
 * Imprimir orden de cocina
 */
async function printOrder(order) {
  return new Promise((resolve, reject) => {
    const device = getPrinterDevice();
    
    device.open(function(error) {
      if (error) {
        console.error('Error abriendo impresora:', error);
        return reject(new Error(`No se pudo conectar a la impresora: ${error.message}`));
      }

      try {
        const printer = new escpos.Printer(device, { encoding: 'utf8' });
        const now = moment().tz('America/Mexico_City');

        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('ORDEN DE COCINA')
          .size(1, 1)
          .style('normal')
          .text('________________________________')
          .feed(1);

        // Información de la orden
        printer
          .align('lt')
          .style('b')
          .text(`ORDEN #${order.id || 'N/A'}`)
          .style('normal')
          .text(`Fecha: ${now.format('DD/MM/YYYY HH:mm')}`)
          .feed(1);

        // Cliente (si existe)
        if (order.customer_name || order.customerName) {
          printer
            .style('b')
            .text('CLIENTE:')
            .style('normal')
            .text(order.customer_name || order.customerName)
            .feed(1);
        }

        // Teléfono (si existe)
        if (order.customer_phone || order.customerPhone) {
          printer
            .text(`Tel: ${order.customer_phone || order.customerPhone}`)
            .feed(1);
        }

        // Dirección (si es delivery)
        if (order.delivery_type === 'delivery' && order.delivery_address) {
          printer
            .style('b')
            .text('DIRECCION:')
            .style('normal')
            .text(order.delivery_address)
            .feed(1);
        }

        // Tipo de entrega (destacado) - detectar si es orden de mesero
        printer
          .align('ct')
          .size(2, 2)
          .style('b');

        // Verificar si es orden de mesero (usando isWaiterOrder flag o tableName)
        if (order.isWaiterOrder || order.tableName) {
          // Diferente formato para comanda comedor vs pedido nuevo
          if (order.isTableUpdate) {
            printer.text('COMANDA COMEDOR');
            printer
              .feed(1)
              .align('ct')
              .size(1, 1)
              .style('b')
              .text('PRODUCTOS ADICIONALES')
              .style('normal');
          } else {
            printer.text('PEDIDO MESA');
          }
          
          // Mostrar nombre de mesa si está disponible
          if (order.tableName) {
            printer
              .size(1, 1)
              .style('normal')
              .feed(1)
              .align('ct')
              .style('b')
              .text(`MESA: ${order.tableName}`)
              .style('normal');
          }
          
          printer
            .feed(1)
            .align('ct')
            .size(1, 1)
            .style('b')
            .text('RECOGER EN LOCAL')
            .style('normal');
        } else if (order.delivery_type === 'delivery') {
          printer.text('DELIVERY');
        } else if (order.delivery_type === 'pickup') {
          printer.text('RECOGER');
        } else if (order.delivery_type === 'dine-in') {
          printer.text('COMER AQUI');
        } else {
          printer.text(order.delivery_type?.toUpperCase() || 'N/A');
        }

        printer
          .size(1, 1)
          .style('normal')
          .feed(1)
          .align('ct')
          .text('________________________________')
          .feed(1);

        // Productos
        printer
          .align('lt')
          .style('b')
          .text('PRODUCTOS:')
          .style('normal')
          .feed(1);

        const items = order.items || [];
        items.forEach((item, index) => {
          // Nombre del producto
          printer
            .style('b')
            .text(`${item.quantity}x ${item.name}`)
            .style('normal');

          // Precio unitario
          if (item.price) {
            printer.text(`   $${parseFloat(item.price).toFixed(2)} c/u`);
          }

          // Extras/Modificadores
          if (item.extras && item.extras.length > 0) {
            item.extras.forEach(extra => {
              printer.text(`   + ${extra.name}`);
              if (extra.price && parseFloat(extra.price) > 0) {
                printer.text(`     $${parseFloat(extra.price).toFixed(2)}`);
              }
            });
          }

          // Notas especiales
          if (item.notes) {
            printer
              .style('i')
              .text(`   Nota: ${item.notes}`)
              .style('normal');
          }

          printer.feed(1);
        });

        // Total
        if (order.total) {
          printer
            .align('ct')
            .text('________________________________')
            .feed(1)
            .size(2, 2)
            .style('b')
            .text(`TOTAL: $${parseFloat(order.total).toFixed(2)}`)
            .size(1, 1)
            .style('normal')
            .feed(1);
        }

        // Método de pago
        if (order.payment_method) {
          let paymentText = '';
          switch(order.payment_method) {
            case 'cash':
              paymentText = 'EFECTIVO';
              break;
            case 'card':
              paymentText = 'TARJETA';
              break;
            case 'mercadopago':
              paymentText = 'MERCADO PAGO';
              break;
            default:
              paymentText = order.payment_method.toUpperCase();
          }
          
          printer
            .align('ct')
            .style('b')
            .text(`PAGO: ${paymentText}`)
            .style('normal')
            .feed(1);
        }

        // Notas generales de la orden
        if (order.notes) {
          printer
            .align('ct')
            .text('________________________________')
            .feed(1)
            .align('lt')
            .style('b')
            .text('NOTAS:')
            .style('normal')
            .text(order.notes)
            .feed(1);
        }

        // Footer
        printer
          .align('ct')
          .text('________________________________')
          .feed(1)
          .text('SuperNova Burgers')
          .text('Gracias por su preferencia')
          .feed(3)
          .cut()
          .close();

        console.log('✅ Orden impresa correctamente');
        resolve({ success: true });

      } catch (err) {
        console.error('Error imprimiendo:', err);
        reject(err);
      }
    });
  });
}

/**
 * Imprimir ticket de prueba
 */
async function printTest() {
  return new Promise((resolve, reject) => {
    const device = getPrinterDevice();
    
    device.open(function(error) {
      if (error) {
        return reject(new Error(`No se pudo conectar: ${error.message}`));
      }

      try {
        const printer = new escpos.Printer(device, { encoding: 'utf8' });
        const now = moment().tz('America/Mexico_City');

        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('PRUEBA DE IMPRESION')
          .size(1, 1)
          .style('normal')
          .feed(2)
          .text('================================')
          .feed(1)
          .text('Servidor de Impresion Raspberry Pi')
          .feed(1)
          .text(`IP: ${PRINTER_IP}:${PRINTER_PORT}`)
          .feed(1)
          .text(`Fecha: ${now.format('DD/MM/YYYY')}`)
          .text(`Hora: ${now.format('HH:mm:ss')}`)
          .feed(1)
          .text('================================')
          .feed(2)
          .size(2, 2)
          .style('b')
          .text('CONEXION EXITOSA')
          .size(1, 1)
          .style('normal')
          .feed(2)
          .text('La impresora esta funcionando')
          .text('correctamente y lista para')
          .text('imprimir ordenes de cocina.')
          .feed(3)
          .text('SuperNova Burgers')
          .feed(3)
          .cut()
          .close();

        console.log('✅ Ticket de prueba impreso');
        resolve({ success: true });

      } catch (err) {
        console.error('Error en prueba:', err);
        reject(err);
      }
    });
  });
}

module.exports = {
  printOrder,
  printTest,
  checkPrinterStatus
};
