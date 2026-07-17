import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Jugador } from '../services/organizador-equipos.service';

/** Jugador posicionado en la cancha con coordenadas relativas (0-1) */
export interface JugadorEnCancha {
  jugador: Jugador;
  x: number; // 0 a 1 (relativo al ancho del canvas)
  y: number; // 0 a 1 (relativo al alto del canvas)
}

@Component({
  selector: 'app-pizarra-cancha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './pizarra-cancha.component.html',
  styleUrls: ['./pizarra-cancha.component.css'],
})
export class PizarraCanchaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canchaCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  readonly STORAGE_KEY = 'jugadoresVoleyV2';
  readonly RADIO_JUGADOR = 38;

  /** Jugadores en el panel (no posicionados en cancha) */
  jugadoresPanel = signal<Jugador[]>([]);

  /** Jugadores posicionados en la cancha */
  jugadoresEnCancha: JugadorEnCancha[] = [];

  /** Jugador actualmente siendo arrastrado en el canvas */
  private dragging: JugadorEnCancha | null = null;
  private dragOffset = { x: 0, y: 0 };

  /** Jugador siendo arrastrado desde el panel hacia el canvas */
  jugadorDesdePanelId: number | null = null;

  /** Colores asignados a cada jugador (por nombre) */
  coloresJugador: Record<string, string> = {};
  readonly COLORES_DISPONIBLES = ['#3b82f6', '#ef4444', '#22c55e', '#06b6d4'];

  private ctx!: CanvasRenderingContext2D;
  private canvasWidth = 0;
  private canvasHeight = 0;
  private resizeObserver!: ResizeObserver;

  constructor(private ngZone: NgZone) {}

  ngOnInit(): void {
    this.cargarColores();
    this.cargarEstadisticas();
    this.cargarJugadores();
    this.actualizarTodosJugadores();
  }

  ngAfterViewInit(): void {
    const container = this.containerRef.nativeElement;
    this.resizeObserver = new ResizeObserver(() => {
      this.ngZone.run(() => {
        this.setupCanvas();
        this.render();
      });
    });
    this.resizeObserver.observe(container);

    // Forzar un setup inicial con setTimeout por si el observer no dispara inmediato
    setTimeout(() => {
      this.setupCanvas();
      this.render();
    }, 50);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // --- Canvas setup ---

  private setupCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;

    // Calcular dimensiones: tomar el ancho del contenedor y derivar la altura (aspect 3:2)
    const w = container.clientWidth;
    if (w === 0) return;

    const h = Math.round(w * 9 / 9); // aspect ratio 9:9 (media cancha cuadrada)

    this.canvasWidth = w;
    this.canvasHeight = h;

    // Setear dimensiones reales del canvas (no CSS)
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    this.ctx = canvas.getContext('2d')!;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- Renderizado ---

  render(): void {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    this.drawCancha(ctx);
    this.drawJugadores(ctx);
  }

  private drawCancha(ctx: CanvasRenderingContext2D): void {
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    // Fondo azul cancha
    ctx.fillStyle = '#1e3a5f';
    ctx.fillRect(0, 0, w, h);

    // Borde cancha
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Línea de ataque (a 3/9 = 1/3 desde la red, proporción 3:6)
    const lineaAtaque = h / 3;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, lineaAtaque);
    ctx.lineTo(w - 4, lineaAtaque);
    ctx.stroke();
    ctx.setLineDash([]);

    // Red en la parte superior (franja con patrón de malla)
    const redAltura = 18;
    const redY = 4;

    // Fondo de la red
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(4, redY, w - 8, redAltura);

    // Patrón de malla de la red
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.7;
    const cellSize = 10;

    // Líneas verticales
    for (let x = 4; x < w - 4; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, redY);
      ctx.lineTo(x, redY + redAltura);
      ctx.stroke();
    }

    // Líneas horizontales
    for (let y = redY; y <= redY + redAltura; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(4, y);
      ctx.lineTo(w - 4, y);
      ctx.stroke();
    }

    // Borde superior e inferior de la red (cable)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(4, redY);
    ctx.lineTo(w - 4, redY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, redY + redAltura);
    ctx.lineTo(w - 4, redY + redAltura);
    ctx.stroke();

    // Etiquetas de zonas
    ctx.font = 'bold 28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Ataque (arriba): 4, 3, 2 — cerca de la malla
    const ataqueY = redAltura + 30;
    ctx.fillText('4', w / 6, ataqueY);
    ctx.fillText('3', w / 2, ataqueY);
    ctx.fillText('2', (5 * w) / 6, ataqueY);

    // Defensa (abajo): 5, 6, 1 — cerca de la línea de tres
    const defensaY = lineaAtaque + 30;
    ctx.fillText('5', w / 6, defensaY);
    ctx.fillText('6', w / 2, defensaY);
    ctx.fillText('1', (5 * w) / 6, defensaY);
  }

  private drawJugadores(ctx: CanvasRenderingContext2D): void {
    for (const jc of this.jugadoresEnCancha) {
      const px = jc.x * this.canvasWidth;
      const py = jc.y * this.canvasHeight;
      const r = this.RADIO_JUGADOR;

      // Círculo
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = this.getColorByName(jc.jugador.nombre);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Nombre
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const nombre = jc.jugador.nombre.length > 8
        ? jc.jugador.nombre.substring(0, 7) + '…'
        : jc.jugador.nombre;
      ctx.fillText(nombre, px, py);
    }
  }

  // --- Eventos del canvas ---

  onCanvasMouseDown(event: MouseEvent): void {
    const pos = this.getCanvasPos(event);
    this.dragging = this.findJugadorAt(pos.x, pos.y);
    if (this.dragging) {
      const px = this.dragging.x * this.canvasWidth;
      const py = this.dragging.y * this.canvasHeight;
      this.dragOffset = { x: pos.x - px, y: pos.y - py };
    }
  }

  onCanvasMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    const pos = this.getCanvasPos(event);
    this.dragging.x = (pos.x - this.dragOffset.x) / this.canvasWidth;
    this.dragging.y = (pos.y - this.dragOffset.y) / this.canvasHeight;
    this.clampPosition(this.dragging);
    this.render();
  }

  onCanvasMouseUp(): void {
    this.dragging = null;
  }

  onCanvasDblClick(event: MouseEvent): void {
    const pos = this.getCanvasPos(event);
    const jc = this.findJugadorAt(pos.x, pos.y);
    if (jc) {
      // Devolver al panel
      this.jugadoresEnCancha = this.jugadoresEnCancha.filter(j => j !== jc);
      this.jugadoresPanel.set([...this.jugadoresPanel(), jc.jugador]);
      this.actualizarTodosJugadores();
      this.render();
    }
  }

  // Touch events para mobile
  private lastTapTime = 0;
  private lastTapJugador: JugadorEnCancha | null = null;
  readonly DOBLE_TAP_MS = 300;

  onCanvasTouchStart(event: TouchEvent): void {
    event.preventDefault();
    const pos = this.getTouchPos(event);
    const jc = this.findJugadorAt(pos.x, pos.y);

    const ahora = Date.now();
    if (jc && jc === this.lastTapJugador && ahora - this.lastTapTime < this.DOBLE_TAP_MS) {
      // Doble-tap: devolver al panel
      this.jugadoresEnCancha = this.jugadoresEnCancha.filter(j => j !== jc);
      this.jugadoresPanel.set([...this.jugadoresPanel(), jc.jugador]);
      this.actualizarTodosJugadores();
      this.render();
      this.lastTapTime = 0;
      this.lastTapJugador = null;
      return;
    }
    this.lastTapTime = ahora;
    this.lastTapJugador = jc;

    this.dragging = jc;
    if (this.dragging) {
      const px = this.dragging.x * this.canvasWidth;
      const py = this.dragging.y * this.canvasHeight;
      this.dragOffset = { x: pos.x - px, y: pos.y - py };
    }
  }

  onCanvasTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.dragging) return;
    const pos = this.getTouchPos(event);
    this.dragging.x = (pos.x - this.dragOffset.x) / this.canvasWidth;
    this.dragging.y = (pos.y - this.dragOffset.y) / this.canvasHeight;
    this.clampPosition(this.dragging);
    this.render();
  }

  onCanvasTouchEnd(): void {
    this.dragging = null;
  }

  // --- Drag desde panel al canvas ---

  onPanelDragStart(event: DragEvent, jugador: Jugador): void {
    this.jugadorDesdePanelId = jugador.id;
    event.dataTransfer?.setData('text/plain', jugador.id.toString());
  }

  onCanvasDragOver(event: DragEvent): void {
    event.preventDefault(); // Permitir drop
  }

  onCanvasDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.jugadorDesdePanelId === null) return;

    const panel = this.jugadoresPanel();
    const jugador = panel.find(j => j.id === this.jugadorDesdePanelId);
    if (!jugador) return;

    const pos = this.getCanvasPos(event as any);
    const x = pos.x / this.canvasWidth;
    const y = pos.y / this.canvasHeight;

    this.jugadoresEnCancha.push({ jugador, x, y });
    this.jugadoresPanel.set(panel.filter(j => j.id !== jugador.id));
    this.jugadorDesdePanelId = null;
    this.actualizarTodosJugadores();
    this.render();
  }

  // --- Utilidades ---

  private getCanvasPos(event: MouseEvent | DragEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private getTouchPos(event: TouchEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  private findJugadorAt(x: number, y: number): JugadorEnCancha | null {
    const r = this.RADIO_JUGADOR;
    // Buscar de último a primero (el que está "encima")
    for (let i = this.jugadoresEnCancha.length - 1; i >= 0; i--) {
      const jc = this.jugadoresEnCancha[i];
      const px = jc.x * this.canvasWidth;
      const py = jc.y * this.canvasHeight;
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      if (dist <= r) return jc;
    }
    return null;
  }

  private clampPosition(jc: JugadorEnCancha): void {
    jc.x = Math.max(0.03, Math.min(0.97, jc.x));
    jc.y = Math.max(0.05, Math.min(0.95, jc.y));
  }

  /** Envía un jugador del panel a la cancha (posición aleatoria en la mitad inferior) */
  enviarACancha(jugador: Jugador): void {
    const panel = this.jugadoresPanel();
    if (!panel.find(j => j.id === jugador.id)) return;

    // Posición aleatoria en la zona de defensa (mitad inferior)
    const x = 0.15 + Math.random() * 0.7;
    const y = 0.4 + Math.random() * 0.5;

    this.jugadoresEnCancha.push({ jugador, x, y });
    this.jugadoresPanel.set(panel.filter(j => j.id !== jugador.id));
    this.actualizarTodosJugadores();
    this.render();
  }

  /** Agrega un nuevo jugador al panel con nombre editable */
  agregarJugador(): void {
    const panel = this.jugadoresPanel();
    const enCancha = this.jugadoresEnCancha.map(jc => jc.jugador);
    const todos = [...panel, ...enCancha];
    const maxId = todos.length > 0 ? Math.max(...todos.map(j => j.id)) : 0;

    const nuevo: Jugador = {
      id: maxId + 1,
      nombre: `Jugador ${maxId + 1}`,
      puntaje: 4 as Jugador['puntaje'],
      posiciones: ['punta', 'central'],
    };

    this.jugadoresPanel.set([...panel, nuevo]);
    this.actualizarTodosJugadores();
  }

  /** Cicla el color de un jugador entre los disponibles */
  ciclarColor(jugador: Jugador): void {
    const actual = this.coloresJugador[jugador.nombre] || this.COLORES_DISPONIBLES[0];
    const idx = this.COLORES_DISPONIBLES.indexOf(actual);
    const siguiente = this.COLORES_DISPONIBLES[(idx + 1) % this.COLORES_DISPONIBLES.length];
    this.coloresJugador[jugador.nombre] = siguiente;
    this.guardarColores();
    this.render();
  }

  /** Obtiene el color de un jugador (default azul) */
  getColor(jugadorId: number): string {
    // Buscar por nombre en panel o cancha
    const panel = this.jugadoresPanel();
    const enCancha = this.jugadoresEnCancha.map(jc => jc.jugador);
    const jugador = [...panel, ...enCancha].find(j => j.id === jugadorId);
    if (jugador && this.coloresJugador[jugador.nombre]) {
      return this.coloresJugador[jugador.nombre];
    }
    return this.COLORES_DISPONIBLES[0];
  }

  /** Obtiene el color por nombre directamente */
  getColorByName(nombre: string): string {
    return this.coloresJugador[nombre] || this.COLORES_DISPONIBLES[0];
  }

  // --- Estadísticas de saques y recepciones ---

  /** Tipo: 'saque' | 'recepcion', Calidad: 'buena' | 'media' | 'mala' */
  estadisticas: Record<string, Record<string, Record<string, number>>> = {};

  /** Todos los jugadores (panel + cancha) */
  todosLosJugadores = signal<Jugador[]>([]);

  /** Modo de registro: suma o resta (para corregir errores) */
  modoResta = signal<boolean>(false);

  /** Alterna entre modo suma y resta */
  toggleModoRegistro(): void {
    this.modoResta.set(!this.modoResta());
  }

  /** Registra un saque o recepción (suma o resta según el modo activo) */
  registrar(nombre: string, tipo: string, calidad: string): void {
    if (!this.estadisticas[nombre]) {
      this.estadisticas[nombre] = { saque: { buena: 0, media: 0, mala: 0 }, recepcion: { buena: 0, media: 0, mala: 0 } };
    }
    const delta = this.modoResta() ? -1 : 1;
    this.estadisticas[nombre][tipo][calidad] = Math.max(0, this.estadisticas[nombre][tipo][calidad] + delta);
    this.guardarEstadisticas();
    this.actualizarTodosJugadores();
  }

  /** Obtiene el conteo de una estadística */
  getEstadistica(nombre: string, tipo: string, calidad: string): number {
    return this.estadisticas[nombre]?.[tipo]?.[calidad] || 0;
  }

  /** Persiste estadísticas en localStorage */
  private guardarEstadisticas(): void {
    localStorage.setItem('pizarraEstadisticas', JSON.stringify(this.estadisticas));
  }

  /** Carga estadísticas desde localStorage */
  private cargarEstadisticas(): void {
    try {
      const data = localStorage.getItem('pizarraEstadisticas');
      if (data) {
        this.estadisticas = JSON.parse(data);
      }
    } catch {
      this.estadisticas = {};
    }
  }

  /** Limpia todos los registros de saques y recepciones (con confirmación) */
  limpiarEstadisticas(): void {
    if (confirm('¿Estás seguro de que querés eliminar todos los registros de saques y recepciones?')) {
      this.estadisticas = {};
      this.guardarEstadisticas();
      this.actualizarTodosJugadores();
    }
  }

  /** Actualiza la lista combinada de todos los jugadores (cancha primero, luego panel) */
  private actualizarTodosJugadores(): void {
    const enCancha = this.jugadoresEnCancha.map(jc => jc.jugador);
    const panel = this.jugadoresPanel();
    this.todosLosJugadores.set([...enCancha, ...panel]);
  }

  /** Persiste los colores en localStorage */
  private guardarColores(): void {
    localStorage.setItem('pizarraColores', JSON.stringify(this.coloresJugador));
  }

  /** Carga los colores desde localStorage */
  private cargarColores(): void {
    try {
      const data = localStorage.getItem('pizarraColores');
      if (data) {
        this.coloresJugador = JSON.parse(data);
      } else {
        // Colores por defecto de la configuración inicial
        this.coloresJugador = {
          'Benja': '#22c55e',
          'Javi': '#ef4444',
          'Camacho': '#22c55e',
          'Mauro': '#22c55e',
          'Daniel': '#ef4444',
          'Yari': '#06b6d4',
          'Natu': '#ef4444',
          'Lukas': '#3b82f6',
          'Alanis': '#ef4444',
          'Rigo': '#3b82f6',
          'Pandres': '#22c55e',
        };
        this.guardarColores();
      }
    } catch {
      this.coloresJugador = {};
    }
  }

  // --- Carga de jugadores ---

  cargarJugadores(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const jugadores: Jugador[] = JSON.parse(data);
        const validos = jugadores.filter(j => j.id && j.nombre);
        if (validos.length > 0) {
          this.jugadoresPanel.set(validos);
          return;
        }
      }
    } catch {
      // JSON inválido
    }
    this.jugadoresPanel.set(this.generarJugadoresEjemplo());
  }

  private generarJugadoresEjemplo(): Jugador[] {
    const nombres = ['Benja', 'Javi', 'Camacho', 'Mauro', 'Daniel', 'Yari', 'Natu', 'Lukas', 'Alanis', 'Rigo', 'Pandres'];
    return nombres.map((nombre, i) => ({
      id: i + 1,
      nombre,
      puntaje: 4 as Jugador['puntaje'],
      posiciones: ['punta', 'central'],
    }));
  }
}
