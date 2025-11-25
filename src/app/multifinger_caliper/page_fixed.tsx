// Componente para el gráfico del caliper
const CaliperPlot = ({ data }: { data: any }) => {
    console.log("Renderizando CaliperPlot con datos:", data);

    // Verificar que los datos existen
    if (!data || !data.plot_data) {
        return (
            <div className="w-full mt-8 p-4 border border-gray-300 rounded-lg bg-gray-50">
                <p className="text-gray-600">Cargando datos del gráfico...</p>
            </div>
        );
    }

    const { plot_data } = data;

    // Verificar que data.plot_data existe
    if (!plot_data) {
        return (
            <div className="w-full mt-8 p-4 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-600">Error: No se encontraron datos de plot_data</p>
                <p className="text-sm text-gray-600 mt-2">
                    La respuesta del servidor no contiene plot_data
                </p>
            </div>
        );
    }

    // Verificar que plot_data tenga las propiedades necesarias
    console.log("Plot data received:", plot_data);
    console.log("Available keys:", Object.keys(plot_data || {}));
    console.log("Depth array length:", plot_data?.depth?.length);
    console.log("Min diameter array length:", plot_data?.min_diameter?.length);

    // Validación más robusta
    const hasDepth = plot_data && plot_data.depth && Array.isArray(plot_data.depth) && plot_data.depth.length > 0;
    const hasMinDiameter = plot_data && plot_data.min_diameter && Array.isArray(plot_data.min_diameter) && plot_data.min_diameter.length > 0;
    const hasMaxDiameter = plot_data && plot_data.max_diameter && Array.isArray(plot_data.max_diameter) && plot_data.max_diameter.length > 0;
    const hasAvgDiameter = plot_data && plot_data.avg_diameter && Array.isArray(plot_data.avg_diameter) && plot_data.avg_diameter.length > 0;

    console.log("Validation results:", { hasDepth, hasMinDiameter, hasMaxDiameter, hasAvgDiameter });

    if (!hasDepth || !hasMinDiameter || !hasMaxDiameter || !hasAvgDiameter) {
        return (
            <div className="w-full mt-8 p-4 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-600">Error: Datos del gráfico incompletos</p>
                <p className="text-sm text-gray-600 mt-2">
                    Propiedades requeridas: depth, min_diameter, max_diameter, avg_diameter
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Recibido: depth={plot_data?.depth?.length || 0}, min={plot_data?.min_diameter?.length || 0}, max={plot_data?.max_diameter?.length || 0}, avg={plot_data?.avg_diameter?.length || 0}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                    Validación: depth={hasDepth}, min={hasMinDiameter}, max={hasMaxDiameter}, avg={hasAvgDiameter}
                </p>
            </div>
        );
    }

    // Estado para el tooltip
    const [tooltip, setTooltip] = useState<{
        visible: boolean;
        x: number;
        y: number;
        depth: number;
        minDiameter: number;
        maxDiameter: number;
        avgDiameter: number;
    } | null>(null);

    // Rangos de datos con validación
    const depthMin = Math.min(...plot_data.depth);
    const depthMax = Math.max(...plot_data.depth);
    const diameterMin = Math.min(...plot_data.min_diameter);
    const diameterMax = Math.max(...plot_data.max_diameter);

    // Estado para el zoom (ahora con barras de scroll nativas)
    const [zoomState, setZoomState] = useState<{
        isZooming: boolean;
        startY: number;
        endY: number;
        zoomMinDepth: number;
        zoomMaxDepth: number;
        lastRightClick: number;
    }>({
        isZooming: false,
        startY: 0,
        endY: 0,
        zoomMinDepth: depthMin,
        zoomMaxDepth: depthMax,
        lastRightClick: 0
    });

    // Dimensiones del gráfico
    const baseWidth = 800;
    const baseHeight = 600;

    // Calcular si hay zoom activo
    const hasZoom = zoomState.zoomMinDepth !== depthMin || zoomState.zoomMaxDepth !== depthMax;

    // Dimensiones del contenedor (siempre fijo)
    const containerWidth = baseWidth;
    const containerHeight = baseHeight;

    // Dimensiones del SVG (solo expandir altura para zoom en profundidad, ancho fijo)
    const plotWidth = baseWidth; // Ancho fijo para eje X (diámetro)
    const plotHeight = hasZoom ? baseHeight * 2.5 : baseHeight; // Solo altura se expande para zoom en profundidad

    // Escalas (con zoom aplicado)
    const currentDepthMin = zoomState.zoomMinDepth;
    const currentDepthMax = zoomState.zoomMaxDepth;
    const depthRange = currentDepthMax - currentDepthMin;
    const diameterRange = diameterMax - diameterMin;

    // Función para crear path de línea SVG
    const createLinePath = (depths: number[], values: number[], color: string) => {
        const points = depths.map((depth, index) => {
            const x = 90 + ((values[index] - diameterMin) / diameterRange) * (plotWidth - 180); // Diámetro en X (más margen)
            const y = 50 + ((depth - currentDepthMin) / depthRange) * (plotHeight - 100); // Profundidad en Y (con zoom)
            return `${x},${y}`;
        }).join(' L');

        return `M${points}`;
    };

    // Función para manejar movimiento del mouse
    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Solo mostrar tooltip si está dentro del área del gráfico
        if (mouseX < 90 || mouseX > plotWidth - 90 || mouseY < 50 || mouseY > plotHeight - 50) {
            setTooltip(null);
            return;
        }

        // Encontrar el punto de datos más cercano
        const plotAreaWidth = plotWidth - 180;
        const plotAreaHeight = plotHeight - 100;

        // Calcular la profundidad basada en la posición Y del mouse (invertida)
        const depthFromMouse = currentDepthMin + ((mouseY - 50) / plotAreaHeight) * depthRange;

        // Encontrar el índice más cercano en los datos
        let closestIndex = 0;
        let minDistance = Math.abs(plot_data.depth[0] - depthFromMouse);

        for (let i = 1; i < plot_data.depth.length; i++) {
            const distance = Math.abs(plot_data.depth[i] - depthFromMouse);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
            }
        }

        // Obtener los valores del punto más cercano
        const depth = plot_data.depth[closestIndex];
        const minValue = plot_data.min_diameter[closestIndex];
        const maxValue = plot_data.max_diameter[closestIndex];
        const avgValue = plot_data.avg_diameter[closestIndex];

        setTooltip({
            visible: true,
            x: mouseX,
            y: mouseY,
            depth: depth,
            minDiameter: minValue,
            maxDiameter: maxValue,
            avgDiameter: avgValue
        });
    };

    // Función para manejar cuando el mouse sale del gráfico
    const handleMouseLeave = () => {
        setTooltip(null);
    };

    // Funciones para el zoom
    const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
        if (event.button === 2) { // Botón derecho
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            const mouseY = event.clientY - rect.top;

            // Siempre permitir iniciar selección de zoom (incluso sobre zoom existente)
            if (mouseY >= 50 && mouseY <= plotHeight - 50) {
                setZoomState(prev => ({
                    ...prev,
                    isZooming: true,
                    startY: mouseY,
                    endY: mouseY,
                    lastRightClick: Date.now()
                }));
            }
        }
    };

    const handleMouseMoveZoom = (event: React.MouseEvent<SVGSVGElement>) => {
        if (zoomState.isZooming) {
            const rect = event.currentTarget.getBoundingClientRect();
            const mouseY = event.clientY - rect.top;

            if (mouseY >= 50 && mouseY <= plotHeight - 50) {
                setZoomState(prev => ({
                    ...prev,
                    endY: mouseY
                }));
            }
        }
    };

    const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
        if (event.button === 2 && zoomState.isZooming) { // Botón derecho
            event.preventDefault();

            const startY = Math.min(zoomState.startY, zoomState.endY);
            const endY = Math.max(zoomState.startY, zoomState.endY);

            if (Math.abs(endY - startY) > 30) { // Mínimo 30px de selección para activar zoom
                // Calcular las profundidades correspondientes
                const plotAreaHeight = plotHeight - 100;
                const zoomStartDepth = currentDepthMin + ((startY - 50) / plotAreaHeight) * depthRange;
                const zoomEndDepth = currentDepthMin + ((endY - 50) / plotAreaHeight) * depthRange;

                setZoomState(prev => ({
                    ...prev,
                    isZooming: false,
                    zoomMinDepth: zoomStartDepth,
                    zoomMaxDepth: zoomEndDepth,
                    lastRightClick: 0
                }));
            } else {
                // Si la selección es muy pequeña, solo terminar el estado de zoom sin hacer cambios
                setZoomState(prev => ({
                    ...prev,
                    isZooming: false,
                    lastRightClick: 0
                }));
            }
        }
    };


    // Función para resetear el zoom
    const resetZoom = () => {
        setZoomState(prev => ({
            ...prev,
            zoomMinDepth: depthMin,
            zoomMaxDepth: depthMax,
            lastRightClick: 0
        }));
    };

    return (
        <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">
                    Análisis Multifinger Caliper - Zoom Vertical en Profundidad
                </h3>
            </div>
            <p className="text-gray-600 mb-4">
                Archivo: {data.filename} | Puntos: {data.total_points} | Escala: 1:500 | Curvas R: {data.r_curves_info.count}
            </p>
            <p className="text-sm text-blue-600 mb-4">
                💡 <strong>Zoom Vertical + Scroll:</strong> Clic derecho + arrastrar para zoom solo en profundidad (eje Y). Barra de scroll vertical nativa aparece con zoom. Eje X (diámetro) permanece fijo. Zoom múltiple ilimitado. Botón "Reset Zoom" para vista completa.
            </p>

            {/* Contenedor que agrupa botón y gráfica, movido 30px a la izquierda */}
            <div style={{ transform: 'translateX(-30px)' }}>
                {/* Botón de reset arriba de la gráfica */}
                {(zoomState.zoomMinDepth !== depthMin || zoomState.zoomMaxDepth !== depthMax) && (
                    <div className="flex justify-center mb-4">
                        <button
                            onClick={resetZoom}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors shadow-md"
                            title="Reset Zoom Vertical - Vuelve a la vista original completa del pozo"
                        >
                            Reset Zoom Vertical
                        </button>
                    </div>
                )}

                {/* Contenedor de la gráfica centrada */}
                <div className="w-full flex justify-center">
                    <div
                        className={`w-full border border-gray-300 rounded-lg bg-white relative ${hasZoom ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
                        style={{
                            width: containerWidth,
                            height: containerHeight,
                            margin: '0 auto'
                        }}
                    >
                    <svg
                        width={plotWidth}
                        height={plotHeight}
                        className={hasZoom ? '' : 'min-w-full'}
                        onMouseMove={(e) => {
                            handleMouseMove(e);
                            handleMouseMoveZoom(e);
                        }}
                        onMouseLeave={handleMouseLeave}
                        onMouseDown={handleMouseDown}
                        onMouseUp={handleMouseUp}
                        onContextMenu={(e) => e.preventDefault()} // Prevenir menú contextual
                    >
                    {/* Grid de fondo */}
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Grupo principal sin transformación de scroll (usamos barras nativas) */}
                    <g>
                        {/* Rectángulo de selección de zoom */}
                        {zoomState.isZooming && (
                            <rect
                                x="90"
                                y={Math.min(zoomState.startY, zoomState.endY)}
                                width={plotWidth - 180}
                                height={Math.abs(zoomState.endY - zoomState.startY)}
                                fill="rgba(59, 130, 246, 0.2)"
                                stroke="#3b82f6"
                                strokeWidth="1"
                                strokeDasharray="5,5"
                            />
                        )}
                        {/* Líneas del gráfico */}
                        {/* Línea de mínimos */}
                        <path
                            d={createLinePath(plot_data.depth, plot_data.min_diameter, '#ef4444')}
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2"
                            opacity="0.8"
                        />

                        {/* Línea de máximos */}
                        <path
                            d={createLinePath(plot_data.depth, plot_data.max_diameter, '#22c55e')}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth="2"
                            opacity="0.8"
                        />

                        {/* Línea de promedios */}
                        <path
                            d={createLinePath(plot_data.depth, plot_data.avg_diameter, '#3b82f6')}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="3"
                            opacity="0.9"
                        />
                    </g>

                    {/* Ejes */}
                    {/* Eje X (Radio en pulgadas) */}
                    <g transform={"translate(0, " + (plotHeight - 50) + ")"}>
                        <line x1="90" y1="0" x2={plotWidth - 90} y2="0" stroke="#374151" strokeWidth="2"/>
                        <text x={plotWidth/2} y="35" fontSize="14" fill="#374151" textAnchor="middle">
                            Diámetro (pulgadas)
                        </text>
                        {/* Marcas en eje X - escala dinámica basada en datos reales */}
                        {Array.from({length: 6}, (_, i) => {
                            const diameterValue = diameterMin + (i * diameterRange / 5);
                            const x = 90 + (i * (plotWidth - 180) / 5);
                            return (
                                <g key={i}>
                                    <line x1={x} y1="0" x2={x} y2="5" stroke="#374151" strokeWidth="1"/>
                                    <text x={x} y="18" fontSize="10" fill="#374151" textAnchor="middle">
                                        {diameterValue.toFixed(2)}"
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Eje Y (Profundidad) */}
                    <g transform="translate(90, 0)">
                        <line x1="0" y1="50" x2="0" y2={plotHeight - 50} stroke="#374151" strokeWidth="2"/>
                        <text x="-55" y={plotHeight/2} fontSize="14" fill="#374151" textAnchor="middle" transform={"rotate(-90, -55, " + (plotHeight/2) + ")"}>
                            Profundidad (pies)
                        </text>
                        {/* Marcas en eje Y (invertidas) */}
                        {Array.from({length: 6}, (_, i) => {
                            const depth = currentDepthMin + (i * depthRange / 5);
                            const y = 50 + (i * (plotHeight - 100) / 5);
                            return (
                                <g key={i}>
                                    <line x1="-5" y1={y} x2="0" y2={y} stroke="#374151" strokeWidth="1"/>
                                    <text x="-15" y={y + 4} fontSize="10" fill="#374151" textAnchor="end">
                                        {depth.toFixed(0)}
                                    </text>
                                </g>
                            );
                        })}
                    </g>

                    {/* Leyenda */}
                    <g transform="translate(100, 20)">
                        <rect x="0" y="0" width="200" height="80" fill="white" stroke="#d1d5db" rx="5"/>
                        <line x1="10" y1="20" x2="30" y2="20" stroke="#ef4444" strokeWidth="2"/>
                        <text x="35" y="25" fontSize="12" fill="#374151">Mínimo</text>
                        <line x1="10" y1="40" x2="30" y2="40" stroke="#22c55e" strokeWidth="2"/>
                        <text x="35" y="45" fontSize="12" fill="#374151">Máximo</text>
                        <line x1="10" y1="60" x2="30" y2="60" stroke="#3b82f6" strokeWidth="3"/>
                        <text x="35" y="65" fontSize="12" fill="#374151">Promedio</text>
                    </g>
                    </svg>

                    {/* Tooltip */}
                    {tooltip && tooltip.visible && (
                        <div
                            className="absolute bg-black text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10 text-sm"
                            style={{
                                left: tooltip.x + 20,
                                top: tooltip.y - 10,
                                transform: tooltip.x > plotWidth - 190 ? 'translateX(-100%)' : 'none'
                            }}
                        >
                            <div className="font-semibold mb-1">Profundidad: {tooltip.depth.toFixed(1)} ft</div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span>Diam Mín: {tooltip.minDiameter.toFixed(3)}"</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span>Diam Máx: {tooltip.maxDiameter.toFixed(3)}"</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span>Diam Prom: {tooltip.avgDiameter.toFixed(3)}"</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};