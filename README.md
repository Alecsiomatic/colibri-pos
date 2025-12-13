# 🍽️ Sistema de Gestión de Restaurante - SuperNova

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)](https://www.mysql.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.18-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## 📋 Descripción

Sistema completo de gestión para restaurantes desarrollado con **Next.js 15**, **MySQL** y **TypeScript**. Incluye gestión de menú, pedidos, delivery, analytics profesionales y más.

## ✨ Características Principales

### 🍴 **Sistema de Menú y Pedidos**
- ✅ Menú interactivo con categorías
- ✅ Carrito de compras en tiempo real
- ✅ Checkout con múltiples formas de pago
- ✅ Integración con MercadoPago
- ✅ Sistema de pedidos para mesa (mesero) y delivery

### 👥 **Gestión Multi-Usuario**
- ✅ **Administrador**: Panel completo de gestión
- ✅ **Mesero**: Gestión de mesas y pedidos presenciales
- ✅ **Driver**: Dashboard para delivery con GPS
- ✅ **Cliente**: Experiencia de compra optimizada

### 📊 **Dashboard de Analytics Profesional**
- ✅ **KPIs en tiempo real**: Ventas, órdenes, ticket promedio
- ✅ **Gráficos interactivos**: Tendencias de ventas, productos top
- ✅ **Reportes completos**: Por día, mesa, mesero, productos
- ✅ **Exportación a Excel**: Reportes profesionales
- ✅ **Selector de fechas**: Rangos personalizados
- ✅ **Integración IA**: Insights con OpenAI GPT

### 🚚 **Sistema de Delivery**
- ✅ Tracking en tiempo real con Google Maps
- ✅ Asignación automática de repartidores
- ✅ Estados de pedido en tiempo real
- ✅ Dashboard para drivers

### 🎨 **Interfaz Moderna**
- ✅ Diseño responsive con Tailwind CSS
- ✅ Tema oscuro profesional
- ✅ Componentes UI reutilizables
- ✅ Animaciones y efectos visuales
- ✅ UX optimizada para móviles

### 🔒 **Seguridad y Autenticación**
- ✅ JWT tokens con middleware personalizado
- ✅ Roles y permisos granulares
- ✅ Rutas protegidas por rol
- ✅ Validación de datos robusta

### 📦 **Gestión de Inventario**
- ✅ Control de stock automatizado
- ✅ Historial de movimientos
- ✅ Actualización desde pedidos
- ✅ Alertas de stock bajo

### 💬 **Integraciones**
- ✅ **WhatsApp**: Pedidos por chat
- ✅ **Google Maps**: Delivery y ubicaciones
- ✅ **OpenAI**: Análisis inteligente de negocio
- ✅ **MercadoPago**: Pagos online seguros

## 🚀 Instalación Rápida

### Prerrequisitos
- Node.js 18+ y pnpm
- MySQL 8.0+
- Cuenta de Google Cloud (para Maps)
- Cuenta de OpenAI (opcional, para IA)
- Cuenta de MercadoPago (para pagos)

### 1. Clonar y configurar
\`\`\`bash
git clone https://github.com/alecsiomatiko/restaurante.git
cd restaurante
pnpm install
\`\`\`

### 2. Configurar base de datos
\`\`\`bash
# Crear base de datos MySQL
mysql -u root -p -e "CREATE DATABASE restaurante_db;"

# Ejecutar script de inicialización
node scripts/init-mysql-db.js
\`\`\`

### 3. Variables de entorno
\`\`\`env
# Base de datos
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=restaurante_db

# JWT
JWT_SECRET=tu_jwt_secret_super_seguro

# Google Maps (opcional)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key

# OpenAI (opcional)
OPENAI_API_KEY=tu_openai_key

# MercadoPago (opcional)
MERCADOPAGO_ACCESS_TOKEN=tu_token
\`\`\`

### 4. Ejecutar proyecto
\`\`\`bash
pnpm dev
\`\`\`

🎉 **¡Listo!** Ve a \`http://localhost:3000\`

## 📱 Capturas de Pantalla

### Dashboard de Analytics
![Dashboard](public/screenshots/dashboard.png)

### Menú Interactivo
![Menu](public/screenshots/menu.png)

### Panel de Administrador
![Admin](public/screenshots/admin.png)

## 🏗️ Arquitectura Técnica

### Stack Principal
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + MySQL
- **Autenticación**: JWT personalizado
- **UI**: Radix UI + shadcn/ui
- **Gráficos**: Recharts + Chart.js
- **Mapas**: Google Maps API

### Estructura de Carpetas
\`\`\`
📦 restaurante/
├── 📁 app/                    # App Router de Next.js
│   ├── 📁 admin/              # Panel de administración
│   ├── 📁 api/                # Endpoints de la API
│   ├── 📁 menu/               # Páginas del menú
│   ├── 📁 driver/             # Dashboard del repartidor
│   └── 📁 checkout/           # Sistema de pago
├── 📁 components/             # Componentes reutilizables
├── 📁 lib/                    # Utilidades y servicios
├── 📁 hooks/                  # Custom React hooks
└── 📁 scripts/                # Scripts de BD y setup
\`\`\`

## 🔧 Configuración Avanzada

### Analytics con IA
1. Obtén una API key de OpenAI
2. Ve a \`/admin/configuracion-empresa\`
3. Activa "Reportes con IA"
4. Configura tu API key
5. ¡Disfruta insights inteligentes!

### Configurar Delivery
1. Activa Google Maps API
2. Ve a \`/admin/configuracion-empresa\`
3. Configura radio de entrega
4. Crea usuarios driver
5. ¡El sistema está listo!

## 📊 Funcionalidades del Dashboard

### KPIs Principales
- 💰 **Ventas Totales**: Suma de ingresos en período
- 📦 **Total de Órdenes**: Número de pedidos procesados  
- 🎫 **Ticket Promedio**: Valor medio por orden
- 🏪 **Mesas Activas**: Órdenes en proceso

### Reportes Disponibles
- 📈 **Tendencia de Ventas**: Gráfico temporal con filtros
- 🥘 **Productos Top**: Ranking por ventas y cantidad
- 🏁 **Corte Diario**: Resumen del día actual
- 👨‍🍳 **Performance por Mesero**: Ventas individuales
- 🪑 **Análisis por Mesa**: Productividad de mesas
- 💳 **Métodos de Pago**: Distribución de pagos

### Exportación de Datos
- 📊 **Excel Completo**: Múltiples hojas con todos los datos
- 📅 **Filtros por Fecha**: Rangos personalizables
- 🎯 **Datos Segmentados**: Por mesa, mesero, producto

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit tus cambios (\`git commit -m 'Add some AmazingFeature'\`)
4. Push al branch (\`git push origin feature/AmazingFeature\`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ve el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

¿Tienes alguna pregunta? 

- 📧 **Email**: [tu-email@dominio.com](mailto:tu-email@dominio.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/alecsiomatiko/restaurante/issues)
- 📖 **Documentación**: [Wiki del proyecto](https://github.com/alecsiomatiko/restaurante/wiki)

## 🙏 Reconocimientos

- [Next.js](https://nextjs.org/) - El framework React para producción
- [Tailwind CSS](https://tailwindcss.com/) - Framework de CSS utilitario
- [Radix UI](https://www.radix-ui.com/) - Componentes UI primitivos
- [Recharts](https://recharts.org/) - Librería de gráficos para React

---

<div align="center">

**⭐ ¡Dale una estrella si este proyecto te ayudó! ⭐**

Hecho con ❤️ por [AlecSiomatiko](https://github.com/alecsiomatiko)

</div>
