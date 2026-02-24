// Elementos DOM
const cameraBtn = document.getElementById('cameraBtn');
const cameraModal = document.getElementById('cameraModal');
const cameraVideo = document.getElementById('cameraVideo');
const captureBtn = document.getElementById('captureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const removeBtn = document.getElementById('removeBtn');
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const resultSection = document.getElementById('resultSection');
const resultImage = document.getElementById('resultImage');
const loadingOverlay = document.getElementById('loadingOverlay');
const downloadBtn = document.getElementById('downloadBtn');
const newBtn = document.getElementById('newBtn');
const toast = document.getElementById('toast');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const countdownEl = document.getElementById('countdown');

let cameraStream = null;

// Event Listeners
generateBtn.addEventListener('click', generateImage);
downloadBtn.addEventListener('click', downloadImage);
newBtn.addEventListener('click', resetForm);
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileUpload);
cameraBtn.addEventListener('click', async () => {
    cameraModal.style.display = 'block';
    
    // 1. Verificar soporte básico y contexto seguro
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no permite acceso a la cámara. Asegúrate de usar HTTPS o localhost.');
        cameraModal.style.display = 'none';
        return;
    }

    try {
        // 2. Intentar obtener cámara (preferencia: frontal)
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        cameraVideo.srcObject = cameraStream;
    } catch (err) {
        console.error('Error de cámara:', err);
        
        // 3. Mensajes de error más claros
        let msg = 'No se pudo acceder a la cámara.';
        if (err.name === 'NotFoundError' || err.message.includes('not found')) {
            msg = 'No se detectó ninguna cámara conectada. Si estás en PC, conecta una webcam.';
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            msg = 'Permiso denegado. Debes permitir el acceso a la cámara en la barra de dirección.';
        } else if (err.name === 'NotReadableError') {
            msg = 'La cámara está siendo usada por otra aplicación (Zoom, Meet, etc).';
        }
        
        alert(`${msg}\n\nDetalle técnico: ${err.message || err.name}`);
        cameraModal.style.display = 'none';
    }
});
captureBtn.addEventListener('click', startCountdown);
closeCameraBtn.addEventListener('click', closeCamera);

// Funciones
function dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

function checkFormValid() {
    // Verifica si hay imagen en el preview
    const hasImage = imagePreview.src && imagePreview.src.startsWith('data:image');
    generateBtn.disabled = !hasImage;
}

// Manejar subida de archivo desde galería
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            checkFormValid();
        };
        reader.readAsDataURL(file);
    }
}

// Iniciar cuenta regresiva
function startCountdown() {
    let count = 3;
    countdownEl.style.display = 'block';
    countdownEl.textContent = count;
    
    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            countdownEl.textContent = count;
        } else {
            clearInterval(timer);
            countdownEl.style.display = 'none';
            captureImage();
        }
    }, 1000);
}

// Actualiza el preview y validación al capturar imagen
function captureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    imagePreview.src = dataUrl;
    previewContainer.style.display = 'block';
    cameraModal.style.display = 'none';
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    // Asegura que se valide el formulario después de capturar
    checkFormValid();
}

// Quitar imagen capturada
removeBtn.addEventListener('click', () => {
    imagePreview.src = '';
    previewContainer.style.display = 'none';
    checkFormValid();
});

// Generar imagen usando la imagen capturada (base64)
async function generateImage() {
    if (!imagePreview.src || !imagePreview.src.startsWith('data:image')) {
        showToast('La imagen es requerida', 'error');
        imagePreview.classList.add('required');
        setTimeout(() => imagePreview.classList.remove('required'), 1500);
        return;
    }

    // Construir el prompt con los datos de carrera y nombre
    const nombre = window.nombreUsuario || 'Usuario';
    const carrera = window.camisetaSeleccionada;
    const nombreCarrera = carrera ? carrera.name : 'la seleccionada';
    const estiloMarco = window.marcoSeleccionado || 'dorado elegante';
    
    // Conjunto de prompts específicos por carrera
    const promptsPorCarrera = {
        'Administración de Negocios de la Hospitalidad Online': `Retrato conmemorativo de 50 años de CESSA. Persona con ${nombre}, estudiante de Administración de Negocios de la Hospitalidad Online. Medalla dorada "50" destacada, elementos digitales y modernos, tablet/dispositivos tecnológicos sutiles, fondo azul marino con destellos dorados, estilo ejecutivo profesional, luz cinematográfica suave, aura de innovación y transformación digital, tipografía elegante.`,
        
        'Administración de Restaurantes': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, egresado de Administración de Restaurantes. Medalla dorada "50", elementos sutiles de gastronomía (cubiertos finos, platillos gourmet), fondo azul marino con destellos dorados, luz suave tipo retrato profesional, aura de excelencia culinaria y gestión, estilo cinematográfico elegante, tipografía refinada.`,
        
        'Administración Hotelera': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, licenciado en Administración Hotelera. Medalla dorada "50", elementos hoteleros sutiles (llaves de oro, detalles de lujo), fondo azul marino con destellos dorados, luz profesional cinematográfica, aura de hospitalidad y elegancia, tipografía sofisticada, estilo ejecutivo moderno y emotivo.`,
        
        'Gastronomía Internacional': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, Chef especializado en Gastronomía Internacional. Medalla dorada "50", elementos culinarios internacionales (especias, ingredientes gourmet, arte culinario), fondo azul marino con destellos dorados, luz suave tipo retrato profesional, aura de maestría gastronómica global, tipografía elegante, estilo cinématico y artístico.`,
        
        'Gastronomía y Ciencias de los Alimentos': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, egresado de Gastronomía y Ciencias de los Alimentos. Medalla dorada "50", elementos científicos y culinarios fusionados (laboratorio, ingredientes naturales), fondo azul marino con destellos dorados, luz profesional cinematográfica, aura de innovación gastronómica, tipografía moderna y elegante, estilo sofisticado.`,
        
        'Gestión de Negocios de la Hospitalidad': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, administrador en Gestión de Negocios de la Hospitalidad. Medalla dorada "50", elementos de gestión empresarial y hospitalidad (gráficos, símbolos de excelencia), fondo azul marino con destellos dorados, luz suave tipo retrato profesional, aura de liderazgo y servicio, tipografía ejecutiva elegante.`,
        
        'Gestión de Negocios Gastronómicos': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, gestor en Gestión de Negocios Gastronómicos. Medalla dorada "50", elementos gastronómicos empresariales (ingredientes premium, símbolos de negocio), fondo azul marino con destellos dorados, luz cinematográfica suave, aura de emprendimiento culinario y éxito, tipografía sofisticada y moderna.`,
        
        'Gestión Hotelera': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, gestor hotelero. Medalla dorada "50", elementos de gestión hotelera (llaves de lujo, símbolos de hospitalidad), fondo azul marino con destellos dorados, luz suave profesional, aura de hospitalidad de clase mundial, tipografía elegante ejecutiva, estilo cinématico sofisticado.`,
        
        'Nutrición y Ciencias de los Alimentos': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, nutriólogo especializado en Ciencias de los Alimentos. Medalla dorada "50", elementos nutricionales científicos (frutas, verduras, equilibrio saludable), fondo azul marino con destellos dorados, luz profesional suave, aura de salud y bienestar, tipografía moderna elegante, estilo cinématico y cuidadoso.`,
        
        'Relaciones Públicas y Dirección de Eventos': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, profesional en Relaciones Públicas y Dirección de Eventos. Medalla dorada "50", elementos de eventos y comunicación (luces, símbolos de conexión), fondo azul marino con destellos dorados, luz dramática cinematográfica, aura de creatividad y liderazgo comunicativo, tipografía moderna sofisticada.`,
        
        'Relaciones Públicas y Organización de Eventos': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, organizador de Relaciones Públicas y Eventos. Medalla dorada "50", elementos festivos y profesionales (confetti dorado, símbolos de celebración), fondo azul marino con destellos dorados, luz suave tipo retrato profesional, aura de dinamismo y excelencia, tipografía elegante y moderna.`,
        
        'Relaciones Públicas y Organización de Eventos Online': `Retrato conmemorativo de 50 años de CESSA. ${nombre}, especialista en Relaciones Públicas y Eventos Online. Medalla dorada "50", elementos digitales y conectados (redes, tecnología), fondo azul marino con destellos dorados, luz cinematográfica moderna, aura de innovación digital y liderazgo, tipografía contemporánea elegante, estilo futurista y sofisticado.`
    };
    
    // Seleccionar prompt según carrera o usar genérico
    let prompt = promptsPorCarrera[nombreCarrera];
    
    if (!prompt) {
        prompt = `Retrato conmemorativo de 50 años de CESSA Universidad. ${nombre}, estudiante de ${nombreCarrera}. 
Medalla dorada "50" destacada, elementos representativos de la carrera, fondo azul marino con destellos dorados, 
luz cinematográfica suave, aura de celebración y legado académico, tipografía elegante, 
estilo profesional emotivo y moderno, alta resolución y ultra detallado.`;
    }

    promptInput.value = prompt;

    loadingOverlay.style.display = 'flex';

    try {
        const formData = new FormData();
        // Convierte el base64 a archivo antes de enviar
        const file = dataURLtoFile(imagePreview.src, 'captured.png');
        formData.append('image', file);
        formData.append('prompt', prompt);

        const response = await fetch('/api/generate', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Error al generar la imagen');
        }

        resultImage.src = data.image;
        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('¡Imagen generada exitosamente! 🎉', 'success');
        
        // Lanzar celebración de graduación
        if (window.confetti) {
            // 1. Lluvia de birretes de graduación
            const scalar = 4;
            const gradCap = confetti.shapeFromText({ text: '🎓', scalar });
            
            window.confetti({
                particleCount: 30,
                spread: 100,
                origin: { y: 0.6 },
                shapes: [gradCap],
                scalar: scalar,
                gravity: 0.7,
                ticks: 300 // Duran más tiempo en pantalla
            });

            // 2. Confeti complementario (Azul CESSA, Dorado, Blanco)
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3761e8', '#FFD700', '#FFFFFF'], // Colores CESSA
                shapes: ['circle'],
                gravity: 0.6
            });
        }
        
        // Mostrar QR con URL de descarga
        console.log('QR recibido:', !!data.qrCode);
        if (data.qrCode) {
            console.log('Mostrando QR...');
            showQRCode(data.qrCode);
        } else {
            console.log('No se recibió QR del servidor');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast(error.message || 'Error al generar la imagen', 'error');
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

function downloadImage() {
    const nombre = window.nombreUsuario || 'Usuario';
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    const segundo = String(fecha.getSeconds()).padStart(2, '0');
    const nombreLimpio = nombre.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ]/g, '_');
    const nombreArchivo = `FotoGraduacion_CESSA_${nombreLimpio}_${dia}-${mes}-${año}_${hora}-${minuto}-${segundo}.png`;
    
    const link = document.createElement('a');
    link.href = resultImage.src;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Imagen descargada', 'success');
}

function resetForm() {
    imagePreview.src = '';
    promptInput.value = '';
    fileInput.value = ''; // Limpiar input file
    previewContainer.style.display = 'none';
    resultSection.style.display = 'none';
    generateBtn.disabled = true;
    
    // Limpiar QR
    const qrContainer = document.getElementById('qr-container');
    if (qrContainer) qrContainer.innerHTML = '';
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Abrir la cámara
async function openCamera() {
    cameraModal.style.display = 'block';
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no permite acceso a la cámara. Asegúrate de usar HTTPS.');
        cameraModal.style.display = 'none';
        return;
    }

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        cameraVideo.srcObject = cameraStream;
    } catch (err) {
        console.error('Error de cámara:', err);
        alert('Error al abrir cámara: ' + (err.message || err.name));
        cameraModal.style.display = 'none';
    }
}

// Cerrar modal de cámara
function closeCamera() {
    cameraModal.style.display = 'none';
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Verificar salud de la API al cargar
async function checkApiHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (!data.hasApiKey) {
            showToast('⚠️ Configura tu GOOGLE_API_KEY en el archivo .env', 'error');
        }
    } catch (error) {
        console.error('Error al verificar la API:', error);
    }
}

// Función para seleccionar color de piel
function selectSkin(tonoPiel) {
    // Remover selección anterior
    document.querySelectorAll('.skin-option').forEach(option => {
        option.style.border = '2px solid #e9ecef';
    });
    
    // Marcar opción seleccionada - buscar por el onclick que contiene el tono
    document.querySelectorAll('.skin-option').forEach(option => {
        if (option.getAttribute('onclick').includes(tonoPiel)) {
            option.style.border = '2px solid #434444ff';
        }
    });
    
    // Guardar selección
    window.tonoSeleccionado = tonoPiel;
    
    // Mostrar botón continuar
    document.getElementById('continue-photo-button').style.display = 'block';
}

// Función para abrir directamente la cámara después de seleccionar color de piel
function abrirCamara() {
    document.getElementById('skinSelectionContainer').style.display = 'none';
    document.getElementById('generatorContainer').style.display = 'block';
    // Abrir modal de cámara automáticamente
    setTimeout(() => {
        document.getElementById('cameraBtn').click();
    }, 100);
}

// Función para continuar a la sección de foto después de seleccionar color de piel
function continuarFoto() {
    document.getElementById('skinSelectionContainer').style.display = 'none';
    document.getElementById('generatorContainer').style.display = 'block';
}

// Función para seleccionar marco
function selectFrame(estiloMarco) {
    // Remover selección anterior
    document.querySelectorAll('.frame-option').forEach(option => {
        option.style.border = '2px solid #e9ecef';
    });
    
    // Marcar opción seleccionada
    document.querySelectorAll('.frame-option').forEach(option => {
        if (option.getAttribute('onclick') && option.getAttribute('onclick').includes(estiloMarco)) {
            option.style.border = '2px solid #434444ff';
        }
    });
    
    // Guardar selección
    window.marcoSeleccionado = estiloMarco;
}

// Función para mostrar QR de descarga
function showQRCode(qrCodeDataUrl) {
    const qrContainer = document.getElementById('qr-container');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    
    // Crear título
    const title = document.createElement('h3');
    title.textContent = '📱 Escanea para descargar tu foto';
    title.style.color = '#3761e8';
    title.style.fontSize = '1.2rem';
    title.style.marginBottom = '15px';
    title.style.fontWeight = 'bold';
    title.style.textShadow = 'none';
    qrContainer.appendChild(title);
    
    // Contenedor del QR con borde decorativo
    const qrWrapper = document.createElement('div');
    qrWrapper.style.display = 'inline-block';
    qrWrapper.style.padding = '15px';
    qrWrapper.style.background = 'white';
    qrWrapper.style.border = '3px solid #3761e8';
    qrWrapper.style.borderRadius = '15px';
    qrWrapper.style.boxShadow = '0 4px 12px rgba(55, 97, 232, 0.2)';
    
    // Mostrar QR generado por el servidor
    const qrImg = document.createElement('img');
    qrImg.src = qrCodeDataUrl;
    qrImg.style.width = '180px';
    qrImg.style.height = '180px';
    qrImg.style.display = 'block';
    qrImg.style.borderRadius = '8px';
    
    qrWrapper.appendChild(qrImg);
    qrContainer.appendChild(qrWrapper);
    
    // Instrucción adicional
    const instruction = document.createElement('p');
    instruction.textContent = 'Escanea con tu celular para guardar tu foto de graduación';
    instruction.style.color = '#6b7280';
    instruction.style.fontSize = '0.9rem';
    instruction.style.marginTop = '12px';
    instruction.style.fontStyle = 'italic';
    qrContainer.appendChild(instruction);
}

// Ejecutar al cargar la página
checkApiHealth();
