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
 * Imprimir orden de cocina / comanda
 */
async function printOrder(orderData) {
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

        // Encabezado
        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('COMANDA DE COCINA')
          .size(1, 1)
          .style('normal')
          .feed(1);

        // Número de pedido
        printer
          .size(2, 2)
          .style('b')
          .text(`PEDIDO #${orderData.orderId || 'N/A'}`)
          .size(1, 1)
          .style('normal')
          .feed(1);

        // Fecha y hora
        printer
          .text(`${now.format('DD/MM/YYYY')} - ${now.format('HH:mm')}`)
          .feed(1)
          .text('================================')
          .feed(1);

        // Tipo de entrega (destacado)
        const deliveryType = orderData.deliveryType || 'pickup';
        printer
          .size(2, 2)
          .style('b');
        
        if (deliveryType === 'delivery') {
          printer.text('DELIVERY');
        } else if (deliveryType === 'pickup') {
          printer.text('RECOGER EN TIENDA');
        } else {
          printer.text('COMER AQUI');
        }
        
        printer
          .size(1, 1)
          .style('normal')
          .feed(1)
          .text('================================')
          .feed(1);

        // Información del cliente
        printer
          .align('lt')
          .style('b')
          .text('CLIENTE')
          .style('normal')
          .feed(1);

        if (orderData.customer && orderData.customer.name) {
          printer.text(`Nombre: ${orderData.customer.name}`);
        }

        if (orderData.customer && orderData.customer.phone) {
          printer.text(`Tel: ${orderData.customer.phone}`).feed(1);
        }

        // Dirección (si es delivery)
        if (deliveryType === 'delivery' && orderData.customer && orderData.customer.address) {
          printer
            .style('b')
            .text('Direccion:')
            .style('normal')
            .text(orderData.customer.address)
            .feed(1);
        }

        printer
          .text('================================')
          .feed(1);

        // Productos
        printer
          .style('b')
          .text('PRODUCTOS A PREPARAR')
          .style('normal')
          .feed(1);

        const items = orderData.items || [];
        items.forEach((item) => {
          printer
            .style('b')
            .text(`[ ${item.quantity}x ] ${item.name}`)
            .style('normal')
            .feed(1);
        });

        // Notas especiales
        if (orderData.customer && orderData.customer.notes) {
          printer
            .feed(1)
            .text('================================')
            .feed(1)
            .style('b')
            .text('NOTAS ESPECIALES:')
            .style('normal')
            .text(orderData.customer.notes)
            .feed(1);
        }

        printer
          .text('================================')
          .feed(1);

        // Información de pago
        printer
          .style('b')
          .text('INFORMACION DE PAGO')
          .style('normal')
          .feed(1);

        let paymentText = 'Efectivo';
        if (orderData.paymentMethod) {
          if (orderData.paymentMethod === 'mercadopago') {
            paymentText = 'Tarjeta (MP)';
          } else if (orderData.paymentMethod === 'card') {
            paymentText = 'Tarjeta';
          }
        }
        
        printer.text(`Metodo: ${paymentText}`);

        // Total
        if (orderData.total) {
          printer
            .feed(1)
            .size(2, 2)
            .style('b')
            .align('ct')
            .text(`TOTAL: $${parseFloat(orderData.total).toFixed(2)}`)
            .size(1, 1)
            .style('normal');
        }

        // Footer
        printer
          .feed(1)
          .text('================================')
          .feed(1)
          .align('ct')
          .text(`Impreso: ${now.format('HH:mm:ss')}`)
          .text('Sistema de Gestion de Pedidos')
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
 * Imprimir ticket de mesa
 */
async function printTableTicket(data) {
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

        // Encabezado
        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2);

        // Nombre del negocio
        if (data.business && data.business.name) {
          printer.text(data.business.name.toUpperCase());
        } else {
          printer.text('RESTAURANTE');
        }

        printer
          .size(1, 1)
          .style('normal')
          .feed(1);

        // Información del negocio
        if (data.business) {
          if (data.business.address) {
            printer.text(data.business.address);
          }
          if (data.business.phone) {
            printer.text(`Tel: ${data.business.phone}`);
          }
        }

        printer
          .text('================================')
          .feed(1);

        // Información de la mesa
        printer
          .size(2, 2)
          .style('b')
          .text(data.tableName || 'MESA')
          .size(1, 1)
          .style('normal')
          .feed(1)
          .text(`Fecha: ${now.format('DD/MM/YYYY HH:mm')}`)
          .feed(1);

        // Número de órdenes
        if (data.orderCount) {
          printer.text(`Ordenes: ${data.orderCount}`);
        }

        printer
          .text('================================')
          .feed(1);

        // Productos
        printer
          .align('lt')
          .style('b')
          .text('PRODUCTOS:')
          .style('normal')
          .feed(1);

        const items = data.items || [];
        items.forEach((item) => {
          const itemName = item.name || 'Sin nombre';
          const qty = item.quantity || 1;
          const price = parseFloat(item.price) || 0;
          
          printer
            .style('b')
            .text(`${qty}x ${itemName}`)
            .style('normal')
            .text(`   $${price.toFixed(2)} c/u  = $${(qty * price).toFixed(2)}`)
            .feed(1);
        });

        // Total
        printer
          .align('ct')
          .text('================================')
          .feed(1)
          .size(2, 2)
          .style('b')
          .text(`TOTAL: $${parseFloat(data.total || 0).toFixed(2)}`)
          .size(1, 1)
          .style('normal')
          .feed(1)
          .text('================================')
          .feed(2);

        // Footer
        printer
          .text('Gracias por su preferencia')
          .feed(3)
          .cut()
          .close();

        console.log('✅ Ticket de mesa impreso correctamente');
        resolve({ success: true });

      } catch (err) {
        console.error('Error imprimiendo ticket de mesa:', err);
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
  checkPrinterStatus,
  printTableTicket
};
