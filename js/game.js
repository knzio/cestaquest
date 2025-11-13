// ============================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================

// Variables globales de pantalla

const gameContainer = document.getElementById('game-container');

const SCREEN_WIDTH = gameContainer.clientWidth;
const SCREEN_HEIGHT = gameContainer.clientHeight;
//const SCREEN_WIDTH = window.innerWidth;
//const SCREEN_HEIGHT = window.innerHeight;
const IS_MOBILE = SCREEN_WIDTH < 768;
const IS_SMALL_MOBILE = SCREEN_WIDTH < 480;

const TILE_SIZE = 48;
// Límites de la mazmorra (Tamaño aleatorio)
const MIN_MAP_SIZE = 30;
const MAX_MAP_SIZE = 50;

const VIEWPORT_WIDTH = 16;
const VIEWPORT_HEIGHT = 11;

// Constantes de reglas de generación
const MAX_ENEMIES = 5; // Regla: 5 enemigos fijos
const MAX_BASKET_ITEMS = 5; // Regla: 5 productos de la cesta a encontrar
const MAX_POTIONS = 4; // Regla: Máximo 4 Tazas de Café (pociones)
const MAX_EQUIPMENT_ITEMS = 4; // Regla: Máximo 4 Armas/Escudos (combinados)

// Constantes de combate
const MISS_CHANCE = 10; // 10% de probabilidad de fallar un golpe

// Tipos de tiles
const TILE = {
    FLOOR: 0,
    WALL: 1,
    PLAYER: 2,
    ENEMY: 3,
    ITEM: 4,
    EXIT: 5
};

// Variables del controlador virtual
let virtualLeft = false;
let virtualRight = false;
let virtualUp = false;
let virtualDown = false;

// Tipos de enemigos (IAs rebeldes)
const ENEMY_TYPES = [
    { name: 'Gemini', logo: 'gemini', emojiKey: 'gem', color: 0x8E75B2, emoji: '💎', hp: 4, attack: 1, defense: 0, speed: 1, xp: 1 },
    { name: 'Copilot', logo: 'copilot', emojiKey: 'ufo', color: 0x00A4EF, emoji: '🛸', hp: 3, attack: 2, defense: 0, speed: 3, xp: 1 },
    { name: 'ChatGPT', logo: 'openai', emojiKey: 'robot', color: 0x412991, emoji: '🤖', hp: 5, attack: 2, defense: 0, speed: 2, xp: 2 },
    { name: 'Claude', logo: 'claude', emojiKey: 'sparkle_green', color: 0xCC9B7A, emoji: '✳️', hp: 7, attack: 3, defense: 1, speed: 2, xp: 2 },
    { name: 'DeepSeek', logo: 'deepseek', emojiKey: 'whale', color: 0x1A73E8, emoji: '🐋', hp: 6, attack: 3, defense: 1, speed: 2, xp: 2 },
    { name: 'Apple AI', logo: 'apple', emojiKey: 'apple', color: 0x0668E1, emoji: '🍎', hp: 8, attack: 3, defense: 1, speed: 1, xp: 3 },
    { name: 'Grok', logo: 'grok', emojiKey: 'hole', color: 0xF2A73B, emoji: '🕳️', hp: 6, attack: 4, defense: 0, speed: 2, xp: 3 },
];

// Tipos de contenedores (paquetes navideños en la oficina)
const CONTAINER_TYPES = [
    { name: 'Paquete de Regalo', emojiKey: 'gift', emoji: '🎁', breakable: false },
    { name: 'Caja de Amazon', emojiKey: 'box', emoji: '📦', breakable: true },
    { name: 'Muñeco de Nieve', emojiKey: 'snowman', emoji: '⛄', breakable: true },
    { name: 'Papelera', emojiKey: 'trash', emoji: '🗑️', breakable: true }
];

// Tipos de items de equipamiento
const ITEM_TYPES = [
    { name: 'Lápiz', type: 'weapon', emojiKey: 'pencil', attack: 2, emoji: '✏️' },
    { name: 'Teclado', type: 'weapon', emojiKey: 'keyboard', attack: 3, emoji: '⌨️' },
    { name: 'Ratón', type: 'weapon', emojiKey: 'mouse', attack: 4, emoji: '🖱️' },
    { name: 'Escudo', type: 'shield', emojiKey: 'shield', defense: 2, emoji: '🛡️' },
    { name: 'Café', type: 'potion', emojiKey: 'coffee', heal: 5, emoji: '☕' },
];

// Productos de la cesta de Navidad (coleccionables)
const BASKET_ITEMS = [
    { name: 'Turrón', emojiKey: 'chocolate', emoji: '🍫', type: 'basket' },
    { name: 'Champán', emojiKey: 'champagne', emoji: '🍾', type: 'basket' },
    { name: 'Jamón', emojiKey: 'meat', emoji: '🍖', type: 'basket' },
    { name: 'Queso', emojiKey: 'cheese', emoji: '🧀', type: 'basket' },
    { name: 'Bombones', emojiKey: 'candy', emoji: '🍬', type: 'basket' },
    { name: 'Mazapán', emojiKey: 'mooncake', emoji: '🥮', type: 'basket' }
];

// ============================================
// GENERADOR DE NÚMEROS ALEATORIOS CON SEMILLA
// ============================================

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}

// ============================================
// GENERADOR DE MAZMORRAS
// ============================================

class DungeonGenerator {
    constructor(width, height, seed) {
        this.width = width;
        this.height = height;
        this.random = new SeededRandom(seed);
        this.map = [];
        this.rooms = [];
        
        // Inicializar mapa con paredes
        for (let y = 0; y < height; y++) {
            this.map[y] = [];
            for (let x = 0; x < width; x++) {
                this.map[y][x] = TILE.WALL;
            }
        }
    }

    generate() {
        // Generar habitaciones (más pequeñas)
        const numRooms = this.random.nextInt(10, 15);
        
        for (let i = 0; i < numRooms; i++) {
            const w = this.random.nextInt(3, 6); 
            const h = this.random.nextInt(3, 5); 
            const x = this.random.nextInt(1, this.width - w - 1);
            const y = this.random.nextInt(1, this.height - h - 1);
            
            const room = { x, y, w, h };
            
            // Verificar si se solapa con otras habitaciones
            let overlap = false;
            for (const otherRoom of this.rooms) {
                if (this.roomsOverlap(room, otherRoom)) {
                    overlap = true;
                    break;
                }
            }
            
            if (!overlap) {
                this.createRoom(room);
                
                // Conectar con la habitación anterior
                if (this.rooms.length > 0) {
                    const prevRoom = this.rooms[this.rooms.length - 1];
                    this.createCorridor(
                        Math.floor(prevRoom.x + prevRoom.w / 2),
                        Math.floor(prevRoom.y + prevRoom.h / 2),
                        Math.floor(room.x + room.w / 2),
                        Math.floor(room.y + room.h / 2)
                    );
                }
                
                this.rooms.push(room);
            }
        }
        
        return this.map;
    }

    roomsOverlap(room1, room2) {
        return room1.x < room2.x + room2.w + 1 &&
               room1.x + room1.w + 1 > room2.x &&
               room1.y < room2.y + room2.h + 1 &&
               room1.y + room1.h + 1 > room2.y;
    }

    createRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    this.map[y][x] = TILE.FLOOR;
                }
            }
        }
    }

    createCorridor(x1, y1, x2, y2) {
        // Corredor horizontal
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (x >= 0 && x < this.width && y1 >= 0 && y1 < this.height) {
                this.map[y1][x] = TILE.FLOOR;
            }
        }
        
        // Corredor vertical
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (x2 >= 0 && x2 < this.width && y >= 0 && y < this.height) {
                this.map[y][x2] = TILE.FLOOR;
            }
        }
    }

    getRandomFloorTile() {
        const floorTiles = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.map[y][x] === TILE.FLOOR) {
                    floorTiles.push({ x, y });
                }
            }
        }
        return floorTiles[this.random.nextInt(0, floorTiles.length - 1)];
    }
}

// ============================================
// ESCENA PRINCIPAL DEL JUEGO
// ============================================

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        // Objeto para almacenar todos los sprites y emojis del juego (OPTIMIZACIÓN)
        this.entitySprites = {};
        
        // Tracking de estadísticas de partida
        this.steps = 0;
        this.defeatedEnemies = [];
        this.killerEnemy = null;
    }

    preload() {
        // ============================================
        // CARGAR EMOJIS TWEMOJI (LOCAL)
        // ============================================
        const emojiAssets = {
            // Principales
            'player': 'player.png',
            'player_hurt': 'player_hurt.png', // 😵 Jugador recibiendo daño
            'exit': 'exit.png', // 🎄 Árbol de Navidad (salida)
            
            // Iconos UI
            'basket_icon': 'basket_icon.png', // 🧺 Icono de cesta
            'weapons_icon': 'weapons_icon.png', // ⚔️ Espadas cruzadas
            'skull': 'skull.png', // 💀 Calavera
            'footprints': 'footprints.png', // 👣 Huellas
            
            // Contenedores
            'gift': 'gift.png',
            'box': 'box.png',
            'snowman': 'snowman.png',
            'trash': 'trash.png',
            
            // Items
            'pencil': 'pencil.png',
            'keyboard': 'keyboard.png',
            'mouse': 'mouse.png',
            'shield': 'shield.png',
            'coffee': 'coffee.png',
            
            // Cesta
            'chocolate': 'chocolate.png',
            'champagne': 'champagne.png',
            'meat': 'meat.png',
            'cheese': 'cheese.png',
            'candy': 'candy.png',
            'mooncake': 'mooncake.png',
            
            // Enemigos (fallback)
            'gem': 'gem.png',
            'ufo': 'ufo.png',
            'robot': 'robot.png',
            'sparkle_green': 'sparkle_green.png',
            'whale': 'whale.png',
            'apple': 'apple.png',
            'hole': 'hole.png',
            
            // Partículas
            'sparkle': 'sparkle.png',
            'dizzy': 'dizzy.png',
            'star': 'star.png',
            
            // UI
            'cross': 'cross.png'
        };
        
        // Cargar todos los emojis desde la carpeta local
        for (const [key, filename] of Object.entries(emojiAssets)) {
            this.load.image(`emoji_${key}`, `assets/emojis/${filename}`);
        }
        
        // ============================================
        // CARGAR LOGOS DE IAs
        // ============================================
        const logoFiles = {
            'gemini': 'gemini.svg',
            'copilot': 'copilot.png',
            'openai': 'openai.svg',
            'claude': 'claude.svg',  
            'apple': 'apple.svg',
            'deepseek': 'deepseek.svg',
            'grok': 'grok.svg'
        };
        
        for (const [key, filename] of Object.entries(logoFiles)) {
            this.load.image(key, `assets/logos/${filename}`);
        }
        
        // Manejar errores de carga
        this.load.on('loaderror', (file) => {
            console.warn(`⚠️ No se pudo cargar: ${file.key}. Se usará emoji como fallback.`);
        });
    }

    create() {
        // Obtener fecha actual
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        
        // Verificar si ya se jugó hoy
        const lastPlayed = localStorage.getItem('cestaquest_last_played');
        if (lastPlayed === dateKey) {
            const savedGame = localStorage.getItem('cestaquest_' + dateKey);
            if (savedGame) {
                const gameData = JSON.parse(savedGame);
                if (gameData.completed) {
                    // Ya se jugó hoy, mostrar pantalla de resumen guardada
                    this.showAlreadyPlayedScreen(gameData);
                    return;
                }
            }
        }
        
        // Obtener semilla del día o de parámetros de URL
        const urlParams = new URLSearchParams(window.location.search);
        const seedParam = urlParams.get('seed');
        
        if (seedParam) {
            this.dailySeed = parseInt(seedParam);
            console.log(`🎲 Usando semilla personalizada: ${seedParam}`);
        } else {
            this.dailySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        }
        
        this.random = new SeededRandom(this.dailySeed);

        // Función global para testing desde consola
        window.dungeon_gen = (seed) => {
            const seedNumber = typeof seed === 'string' ? parseInt(seed) : seed;
            window.location.href = `?seed=${seedNumber}`;
        };
        
        console.log(`🎮 Office Rogue - Semilla actual: ${this.dailySeed}`);
        
        // Determinar el tamaño aleatorio del mapa usando la semilla
        const mapWidth = this.random.nextInt(MIN_MAP_SIZE, MAX_MAP_SIZE);
        const mapHeight = this.random.nextInt(MIN_MAP_SIZE, MAX_MAP_SIZE);

        // Generar mazmorra
        const generator = new DungeonGenerator(mapWidth, mapHeight, this.dailySeed);
        this.map = generator.generate();
        this.rooms = generator.rooms;

        // Almacenar dimensiones en la escena
        this.mapWidth = mapWidth; 
        this.mapHeight = mapHeight; 

        // Sistema de visión con gradiente (en lugar de niebla de guerra)
        this.visionRadius = 5; // Radio de visión completa
        this.fadeRadius = 8; // Radio de visión difuminada

        // Inicializar jugador
        const startPos = generator.getRandomFloorTile();
        this.player = {
            x: startPos.x,
            y: startPos.y,
            hp: 10,
            maxHp: 10,
            baseAttack: 1,
            baseDefense: 0,
            xp: 0,
            xpToNextLevel: 5,
            skillPoints: 0,
        };
        this.player.currentAttack = this.player.baseAttack;
        this.player.currentDefense = this.player.baseDefense;

        // Variable para trackear el enemigo en combate
        this.enemyInCombat = null;
        
        // Inventario de equipamiento (ACUMULATIVO)
        this.equippedGear = []; 
        
        // Productos de la cesta de Navidad recogidos
        this.basketItems = [];

        // Colocar enemigos (REGLA: 5 enemigos fijos)
        this.enemies = [];
        
        for (let i = 0; i < MAX_ENEMIES; i++) {
            let pos;
            do {
                pos = generator.getRandomFloorTile();
            } while (pos.x === this.player.x && pos.y === this.player.y);
            
            let enemyTypeIndex;
            if (i < 3) {
                enemyTypeIndex = this.random.nextInt(0, 3); 
            } else { 
                enemyTypeIndex = this.random.nextInt(4, 6); 
            }
            
            const enemyType = ENEMY_TYPES[enemyTypeIndex];
            
            this.enemies.push({
                id: 'e' + i, 
                x: pos.x,
                y: pos.y,
                ...enemyType,
                maxHp: enemyType.hp
            });
        }
        
        // Colocar items dentro de contenedores
        this.items = [];
        this.containers = [];
        
        let itemsToPlace = [];

        const weaponTypes = ITEM_TYPES.filter(item => item.type === 'weapon');
        const shieldTypes = ITEM_TYPES.filter(item => item.type === 'shield');
        const allEquipmentTypes = [...weaponTypes, ...shieldTypes];
        
        const numEquipment = this.random.nextInt(2, MAX_EQUIPMENT_ITEMS); 
        const selectedEquipment = this.random.shuffle(allEquipmentTypes).slice(0, numEquipment);
        itemsToPlace.push(...selectedEquipment);

        const potionTypes = ITEM_TYPES.filter(item => item.type === 'potion');
        const numPotions = this.random.nextInt(2, MAX_POTIONS); 
        const selectedPotions = this.random.shuffle(potionTypes).slice(0, numPotions);
        itemsToPlace.push(...selectedPotions);

        const allBasketItems = this.random.shuffle(BASKET_ITEMS);
        const selectedBasketItems = allBasketItems.slice(0, MAX_BASKET_ITEMS);

        this.enemyDrops = [];
        const numBasketInContainers = 2; 

        for (let i = 0; i < selectedBasketItems.length; i++) {
            if (i < numBasketInContainers) {
                itemsToPlace.push({ ...selectedBasketItems[i], isBasket: true });
            } else {
                this.enemyDrops.push({ ...selectedBasketItems[i], isBasket: true });
            }
        }
        
        const numItemsInContainers = itemsToPlace.length;
        const numContainers = this.random.nextInt(
            Math.max(10, numItemsInContainers),
            15
        );
        
        const shuffledItems = this.random.shuffle(itemsToPlace);
        
        for (let i = 0; i < numContainers; i++) {
            let pos;
            let attempts = 0;
            const maxAttempts = 50;
            
            // Buscar una posición que no esté ocupada por otro contenedor
            do {
                pos = generator.getRandomFloorTile();
                attempts++;
                
                // Verificar si ya hay un contenedor en esta posición
                const occupied = this.containers.some(c => c.x === pos.x && c.y === pos.y);
                
                if (!occupied) break;
            } while (attempts < maxAttempts);
            
            // Si después de muchos intentos no encontramos posición, usar la última de todos modos
            const containerType = CONTAINER_TYPES[this.random.nextInt(0, CONTAINER_TYPES.length - 1)];
            
            let containerData = {
                id: 'c' + i,
                x: pos.x,
                y: pos.y,
                ...containerType,
            };
            
            if (i < numItemsInContainers) {
                containerData.contains = { ...shuffledItems[i] };
            } else {
                containerData.contains = { name: 'Vacío', type: 'empty', emojiKey: 'cross', emoji: '✖️' }; 
            }
            
            this.containers.push(containerData);
        }
        
        // Colocar salida (asegurar que no coincide con ningún paquete ni item)
        let exitPosition;
        let attempts = 0;
        const maxExitAttempts = 100;
        
        do {
            exitPosition = generator.getRandomFloorTile();
            attempts++;
            
            // Verificar que no coincide con ningún contenedor
            const overlapsContainer = this.containers.some(c => 
                c.x === exitPosition.x && c.y === exitPosition.y
            );
            
            // Verificar que no coincide con el jugador
            const overlapsPlayer = (exitPosition.x === this.player.x && exitPosition.y === this.player.y);
            
            // Verificar que no coincide con ningún enemigo
            const overlapsEnemy = this.enemies.some(e => 
                e.x === exitPosition.x && e.y === exitPosition.y
            );
            
            // Verificar que no coincide con ningún item en el suelo
            const overlapsItem = this.items.some(i => 
                i.x === exitPosition.x && i.y === exitPosition.y
            );
            
            if (!overlapsContainer && !overlapsPlayer && !overlapsEnemy && !overlapsItem) {
                break;
            }
        } while (attempts < maxExitAttempts);
        
        this.exit = {
            x: exitPosition.x,
            y: exitPosition.y
        };
        this.exit.id = 'exit';

        // Crear gráficos y entidades (OPTIMIZACIÓN)
        this.tileGraphics = this.add.graphics();
        this.fogGraphics = this.add.graphics();
        this.createEntities();
        
        // Crear cámara
        this.cameras.main.setBounds(0, 0, this.mapWidth * TILE_SIZE, this.mapHeight * TILE_SIZE); 
        this.cameras.main.setZoom(1);

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        this.canMove = true;

        // Controlador virtual (solo para móviles)
        if (IS_MOBILE) {
            this.createVirtualController();
        }

        // UI
        this.createUI();

        // Log de mensajes
        this.messageLog = [];
        
        // Renderizar inicial
        this.updateEntityVisibility();
        this.centerCamera();
        this.render();

        this.addMessage(`¡Bienvenido a la oficina del día ${today.toLocaleDateString()}!`);
        this.addMessage(`Recupera tu cesta de Navidad (${MAX_BASKET_ITEMS} items) y escapa de las IAs rebeldes.`);
    }

    isAdjacentToFloor(x, y) {
        const neighbors = [
            { dx: 0, dy: 1 }, { dx: 0, dy: -1 }, 
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 },
            { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, 
            { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ];

        for (const n of neighbors) {
            const nx = x + n.dx;
            const ny = y + n.dy;

            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight) {
                if (this.map[ny][nx] === TILE.FLOOR) {
                    return true;
                }
            }
        }
        return false;
    }

    // ============================================
    // CREACIÓN DE ENTIDADES (CON TWEMOJI)
    // ============================================
    createEntities() {
        // Jugador (usando Twemoji) - depth más alto para estar siempre encima
        this.entitySprites.player = this.add.sprite(0, 0, 'emoji_player');
        this.entitySprites.player.setDisplaySize(36, 36);
        this.entitySprites.player.setOrigin(0.5, 0.5);
        this.entitySprites.player.setDepth(10); // Jugador siempre encima de items

        // Salida (usando Twemoji) - Inicialmente invisible
        this.entitySprites.exit = this.add.sprite(0, 0, 'emoji_exit');
        this.entitySprites.exit.setDisplaySize(40, 40); // Árbol un poco más grande
        this.entitySprites.exit.setOrigin(0.5, 0.5);
        this.entitySprites.exit.setVisible(false); // Invisible hasta completar cesta
        this.entitySprites.exit.setDepth(5);

        // Contenedores (usando Twemoji)
        this.entitySprites.containers = {};
        this.containers.forEach(container => {
            const sprite = this.add.sprite(0, 0, `emoji_${container.emojiKey}`);
            sprite.setDisplaySize(33, 33);
            sprite.setOrigin(0.5, 0.5);
            sprite.setVisible(false);
            sprite.setDepth(2);
            this.entitySprites.containers[container.id] = sprite;
        });

        // Enemigos (priorizar logos, fallback a Twemoji)
        this.entitySprites.enemies = {};
        this.enemies.forEach(enemy => {
            let sprite;
            const px = enemy.x * TILE_SIZE + TILE_SIZE / 2;
            const py = enemy.y * TILE_SIZE + TILE_SIZE / 2 + 2;

            // Intentar usar logo primero
            if (this.textures.exists(enemy.logo)) {
                sprite = this.add.sprite(px, py, enemy.logo);
                sprite.setDisplaySize(36, 36);
                // NO aplicar tint para mantener colores originales
            } else if (this.textures.exists(`emoji_${enemy.emojiKey}`)) {
                // Fallback a Twemoji
                sprite = this.add.sprite(px, py, `emoji_${enemy.emojiKey}`);
                sprite.setDisplaySize(33, 33);
            } else {
                // Último fallback a texto (no debería llegar aquí)
                sprite = this.add.text(px, py, enemy.emoji, { 
                    fontSize: '33px',
                    padding: { top: 8, bottom: 2 }
                });
                sprite.setOrigin(0.5, 0.5);
            }
            sprite.setVisible(false);
            sprite.setDepth(3);
            this.entitySprites.enemies[enemy.id] = sprite;
        });
        
        // Items (usamos un grupo)
        this.entitySprites.items = this.add.group();
    }
    
    // ============================================
    // CREAR SPRITE DE ITEM (CON TWEMOJI)
    // ============================================
    createItemSprite(item) {
        const px = item.x * TILE_SIZE + TILE_SIZE / 2;
        const py = item.y * TILE_SIZE + TILE_SIZE / 2 + 2;
        
        let itemSprite;
        
        // Usar Twemoji si existe la key
        if (item.emojiKey && this.textures.exists(`emoji_${item.emojiKey}`)) {
            itemSprite = this.add.sprite(px, py, `emoji_${item.emojiKey}`);
            itemSprite.setDisplaySize(30, 30);
        } else {
            // Fallback a texto
            itemSprite = this.add.text(px, py, item.emoji, { 
                fontSize: '30px',
                padding: { top: 8, bottom: 2 }
            });
            itemSprite.setOrigin(0.5, 0.5);
        }
        
        itemSprite.setDepth(1); // Items debajo del jugador
        this.entitySprites.items.add(itemSprite);
        item.sprite = itemSprite; 
    }

    // ============================================
    // ANIMACIÓN DE DAÑO DEL JUGADOR
    // ============================================
    
    showPlayerHurt() {
        // Cambiar a emoji herido
        this.entitySprites.player.setTexture('emoji_player_hurt');
        
        // Añadir efecto de sacudida
        this.tweens.add({
            targets: this.entitySprites.player,
            x: this.entitySprites.player.x + 5,
            duration: 50,
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                // Volver al emoji normal después de un momento
                this.time.delayedCall(200, () => {
                    this.entitySprites.player.setTexture('emoji_player');
                });
            }
        });
    }
    
    // ============================================
    // LÓGICA DE ITEMS Y COMBATE
    // ============================================
    
    openContainer(containerIndex) {
        const container = this.containers[containerIndex];
        const item = container.contains;
        
        this.cameras.main.shake(150, 0.008);
        
        if (container.breakable) {
            this.addMessage(`💥 Rompes ${container.emoji} ${container.name}!`);
        } else {
            this.addMessage(`🔓 Abres ${container.emoji} ${container.name}!`);
        }
        
        if (item.type === 'empty') {
            this.addMessage(`📦 El ${container.name} estaba vacío...`);
        } else {
            this.addMessage(`✨ Encuentras ${item.emoji} ${item.name}!`);
            
            const newItem = {
                x: container.x,
                y: container.y,
                ...item
            };
            this.items.push(newItem);
            this.createItemSprite(newItem); 
            
            this.createContainerParticles(container.x, container.y);
        }
        
        this.entitySprites.containers[container.id].destroy();
        delete this.entitySprites.containers[container.id];
        this.containers.splice(containerIndex, 1);
    }
    
    pickupItem(itemIndex) {
        const item = this.items[itemIndex];
        
        item.sprite.destroy();
        this.items.splice(itemIndex, 1);

        if (item.type === 'weapon') {
            this.player.currentAttack += item.attack;
            this.addMessage(`${item.emoji} ¡Has recogido ${item.name}! Ataque total: ${this.player.currentAttack} (+${item.attack})`);
            this.equippedGear.push(item);

        } else if (item.type === 'shield') {
            this.player.currentDefense += item.defense;
            this.addMessage(`${item.emoji} ¡Has recogido ${item.name}! Defensa total: ${this.player.currentDefense} (+${item.defense})`);
            this.equippedGear.push(item);
            
        } else if (item.type === 'potion') {
            if (this.player.hp < this.player.maxHp) {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal);
                this.addMessage(`${item.emoji} Has tomado ${item.name}. +${item.heal} HP`);
            } else {
                this.addMessage(`💚 Ya estás a tope de energía. No necesitas el item.`);
                this.items.push(item);
                this.createItemSprite(item);
            }
        } else if (item.type === 'basket') {
            this.basketItems.push(item);
            this.addMessage(`🎄 ¡Has recogido ${item.emoji} ${item.name} de tu cesta! (${this.basketItems.length}/${MAX_BASKET_ITEMS})`);
            
            if (this.basketItems.length === MAX_BASKET_ITEMS) {
                // ¡Cesta completa! Mostrar el árbol de salida
                this.entitySprites.exit.setVisible(true);
                
                // Mostrar mensaje grande y bonito
                this.showBigMessage('🎁 ¡CESTA COMPLETA!\n\n🎄 Corre al árbol para escapar 🎄');
                
                // Efecto visual de aparición del árbol
                this.entitySprites.exit.setAlpha(0);
                this.tweens.add({
                    targets: this.entitySprites.exit,
                    alpha: 1,
                    scale: { from: 0.5, to: 1 },
                    duration: 800,
                    ease: 'Back.easeOut'
                });
                
                // Partículas alrededor del árbol
                this.createTreeParticles(this.exit.x, this.exit.y);
            }
        }
    }
    
    // ============================================
    // LÓGICA DE COMBATE
    // ============================================

    playerTurn(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;

        if (newX < 0 || newX >= this.mapWidth || newY < 0 || newY >= this.mapHeight) return;
        
        if (this.map[newY][newX] === TILE.WALL) {
            return;
        }

        const enemy = this.enemies.find(e => e.x === newX && e.y === newY);
        if (enemy) {
            this.combat(enemy);
            this.enemiesTurn();
            this.updateUI();
            this.render();
            return;
        }

        const containerIndex = this.containers.findIndex(c => c.x === newX && c.y === newY);
        if (containerIndex !== -1) {
            this.openContainer(containerIndex);
            this.enemiesTurn();
            this.updateUI();
            this.render();
            return;
        }

        this.enemyInCombat = null;

        this.player.x = newX;
        this.player.y = newY;
        
        // Incrementar contador de pasos
        this.steps++;

        const itemIndex = this.items.findIndex(i => i.x === newX && i.y === newY);
        if (itemIndex !== -1) {
            this.pickupItem(itemIndex);
        }

        // Verificar salida solo si la cesta está completa Y el árbol es visible
        if (this.player.x === this.exit.x && this.player.y === this.exit.y && this.basketItems.length === MAX_BASKET_ITEMS) {
            this.victory();
            return;
        }

        this.enemiesTurn();
        this.updateEntityVisibility();
        this.centerCamera();
        this.updateUI();
        this.render();
    }

    combat(enemy) {
        this.enemyInCombat = enemy;
        this.cameras.main.shake(100, 0.005);
        
        if (this.rollDice(1, 100) <= MISS_CHANCE) {
            this.addMessage(`💨 Fallas el golpe a ${enemy.emoji} ${enemy.name}!`);
            return;
        }

        const playerDamage = Math.max(1, this.player.currentAttack - enemy.defense + this.rollDice(-1, 1));
        
        enemy.hp -= playerDamage;
        this.addMessage(`⚔️ Atacas a ${enemy.emoji} ${enemy.name} y le haces ${playerDamage} de daño.`);

        if (enemy.hp <= 0) {
            this.addMessage(`💀 ¡Has derrotado a ${enemy.emoji} ${enemy.name}!`);
            
            // Guardar enemigo derrotado con su logo
            this.defeatedEnemies.push({
                name: enemy.name,
                emoji: enemy.emoji,
                emojiKey: enemy.emojiKey,
                logo: enemy.logo // Guardar el logo para cargarlo después
            });
            
            this.player.xp += enemy.xp;
            this.addMessage(`✨ +${enemy.xp} XP (Total: ${this.player.xp})`);
            
            while (this.player.xp >= this.player.xpToNextLevel) {
                this.player.skillPoints++;
                this.player.xp -= this.player.xpToNextLevel;
                this.player.xpToNextLevel += 5;
                
                this.player.currentAttack += 1;
                this.player.maxHp += 2;
                this.player.hp += 2;

                this.addMessage(`⬆️ ¡Subes al Nivel ${this.player.skillPoints}! +1 ATK, +2 HP MAX.`);
            }
            
            if (this.enemyDrops.length > 0) {
                const drop = this.enemyDrops.shift();
                this.addMessage(`🎁 ${enemy.emoji} ${enemy.name} soltó ${drop.emoji} ${drop.name}!`);
                
                const newItem = {
                    x: enemy.x,
                    y: enemy.y,
                    ...drop
                };
                this.items.push(newItem);
                this.createItemSprite(newItem); 
                
                this.createContainerParticles(enemy.x, enemy.y);
            }
            
            this.entitySprites.enemies[enemy.id].destroy();
            delete this.entitySprites.enemies[enemy.id];
            
            this.enemies = this.enemies.filter(e => e !== enemy);
            this.enemyInCombat = null;
            return;
        }
    }

    enemiesTurn() {
        if (this.player.hp <= 0) return;

        const playerX = this.player.x;
        const playerY = this.player.y;
        
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            
            // Los enemigos solo se activan si están en el rango de visión del jugador
            const distance = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);
            const detectionRange = enemy.speed * 5;
            
            if (distance > detectionRange) continue;
            
            let dx = 0;
            let dy = 0;

            if (this.rollDice(0, 1) === 1) {
                dx = playerX > enemy.x ? 1 : (playerX < enemy.x ? -1 : 0);
            } else {
                dy = playerY > enemy.y ? 1 : (playerY < enemy.y ? -1 : 0);
            }

            const newX = enemy.x + dx;
            const newY = enemy.y + dy;

            if (newX === playerX && newY === playerY) {
                this.enemyInCombat = enemy;
                this.cameras.main.shake(100, 0.005);
                
                if (this.rollDice(1, 100) <= MISS_CHANCE) {
                    this.addMessage(`${enemy.emoji} ${enemy.name} falla el ataque!`);
                    continue;
                }

                const enemyDamage = Math.max(1, enemy.attack - this.player.currentDefense + this.rollDice(-1, 1));
                this.player.hp -= enemyDamage;
                this.addMessage(`${enemy.emoji} ${enemy.name} te ataca y te hace ${enemyDamage} de daño.`);
                
                // Mostrar animación de daño
                this.showPlayerHurt();

                if (this.player.hp <= 0) {
                    // Guardar el enemigo que te mató con su logo
                    this.killerEnemy = {
                        name: enemy.name,
                        emoji: enemy.emoji,
                        emojiKey: enemy.emojiKey,
                        logo: enemy.logo
                    };
                    this.gameOver();
                }
                continue;
            }

            if (newX >= 0 && newX < this.mapWidth && newY >= 0 && newY < this.mapHeight && this.map[newY][newX] === TILE.FLOOR) {
                let blocked = false;
                
                // Verificar colisión con otros enemigos
                for (let j = 0; j < this.enemies.length; j++) {
                    if (i !== j && this.enemies[j].x === newX && this.enemies[j].y === newY) {
                        blocked = true;
                        break;
                    }
                }
                
                // Verificar colisión con contenedores
                if (!blocked) {
                    for (const container of this.containers) {
                        if (container.x === newX && container.y === newY) {
                            blocked = true;
                            break;
                        }
                    }
                }
                
                // Verificar colisión con items en el suelo
                if (!blocked) {
                    for (const item of this.items) {
                        if (item.x === newX && item.y === newY) {
                            blocked = true;
                            break;
                        }
                    }
                }
                
                // Verificar colisión con el árbol de salida
                if (!blocked && this.exit && this.exit.x === newX && this.exit.y === newY) {
                    blocked = true;
                }
                
                if (!blocked) {
                    enemy.x = newX;
                    enemy.y = newY;
                }
            }
        }
    }

    createContainerParticles(x, y) {
        const particleKeys = ['sparkle', 'dizzy', 'star'];
        const numParticles = 6;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const distance = 20;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            const randomKey = particleKeys[Math.floor(Math.random() * particleKeys.length)];
            const particle = this.add.sprite(
                x * TILE_SIZE + TILE_SIZE / 2 + offsetX,
                y * TILE_SIZE + TILE_SIZE / 2 + offsetY,
                `emoji_${randomKey}`
            );
            particle.setDisplaySize(16, 16);
            particle.setAlpha(1);
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                y: particle.y - 30,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
    
    createTreeParticles(x, y) {
        // Partículas especiales para la aparición del árbol
        const particleKeys = ['sparkle', 'star'];
        const numParticles = 12;
        
        for (let i = 0; i < numParticles; i++) {
            const angle = (Math.PI * 2 * i) / numParticles;
            const distance = 40;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            const randomKey = particleKeys[Math.floor(Math.random() * particleKeys.length)];
            const particle = this.add.sprite(
                x * TILE_SIZE + TILE_SIZE / 2 + offsetX,
                y * TILE_SIZE + TILE_SIZE / 2 + offsetY,
                `emoji_${randomKey}`
            );
            particle.setDisplaySize(20, 20);
            particle.setAlpha(1);
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                y: particle.y - 50,
                x: particle.x + (Math.random() - 0.5) * 30,
                duration: 1500,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
        
        // Sacudir la cámara
        this.cameras.main.shake(300, 0.005);
    }
    
    showBigMessage(text) {
        // Tamaños responsive
        const fontSize = IS_SMALL_MOBILE ? '24px' : (IS_MOBILE ? '32px' : '48px');
        const strokeThickness = IS_SMALL_MOBILE ? 3 : (IS_MOBILE ? 4 : 6);
        const maxWidth = IS_MOBILE ? SCREEN_WIDTH - 40 : 600;
        
        // Crear mensaje grande en el centro de la pantalla
        const bigText = this.add.text(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, text, {
            fontSize: fontSize,
            fill: '#FFFFFF', // Blanco en lugar de dorado
            fontStyle: 'bold',
            align: 'center',
            stroke: '#C41E3A',
            strokeThickness: strokeThickness,
            wordWrap: { width: maxWidth, useAdvancedWrap: true },
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000',
                blur: 10,
                fill: true
            }
        });
        bigText.setOrigin(0.5);
        bigText.setScrollFactor(0);
        bigText.setDepth(999);
        bigText.setAlpha(0);
        bigText.setScale(0.5);
        
        // Animación de entrada
        this.tweens.add({
            targets: bigText,
            alpha: 1,
            scale: 1,
            duration: 500,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Mantener visible 2 segundos
                this.time.delayedCall(2000, () => {
                    // Animación de salida
                    this.tweens.add({
                        targets: bigText,
                        alpha: 0,
                        scale: 1.2,
                        duration: 400,
                        ease: 'Cubic.easeIn',
                        onComplete: () => {
                            bigText.destroy();
                        }
                    });
                });
            }
        });
    }

    rollDice(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // ============================================
    // SISTEMA DE VISIÓN CON GRADIENTE
    // ============================================
    
    getDistanceToPlayer(x, y) {
        const dx = x - this.player.x;
        const dy = y - this.player.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    getVisibilityAlpha(distance) {
        if (distance <= this.visionRadius) {
            // Visión completa
            return 1;
        } else if (distance <= this.fadeRadius) {
            // Zona de transición (difuminado)
            const fadeRange = this.fadeRadius - this.visionRadius;
            const fadeDistance = distance - this.visionRadius;
            return 1 - (fadeDistance / fadeRange);
        } else {
            // Invisible
            return 0;
        }
    }
    
    updateEntityVisibility() {
        // Actualizar salida (solo visible si la cesta está completa)
        if (this.basketItems.length === MAX_BASKET_ITEMS) {
            const exitDist = this.getDistanceToPlayer(this.exit.x, this.exit.y);
            const exitAlpha = this.getVisibilityAlpha(exitDist);
            this.entitySprites.exit.setAlpha(exitAlpha);
            this.entitySprites.exit.setVisible(exitAlpha > 0);
        } else {
            this.entitySprites.exit.setVisible(false);
        }

        // Actualizar contenedores
        this.containers.forEach(container => {
            const sprite = this.entitySprites.containers[container.id];
            const dist = this.getDistanceToPlayer(container.x, container.y);
            const alpha = this.getVisibilityAlpha(dist);
            sprite.setAlpha(alpha);
            sprite.setVisible(alpha > 0);
        });

        // Actualizar enemigos
        this.enemies.forEach(enemy => {
            const sprite = this.entitySprites.enemies[enemy.id];
            const dist = this.getDistanceToPlayer(enemy.x, enemy.y);
            const alpha = this.getVisibilityAlpha(dist);
            sprite.setAlpha(alpha);
            sprite.setVisible(alpha > 0);
        });

        // Actualizar items
        this.items.forEach(item => {
            if (item.sprite) {
                const dist = this.getDistanceToPlayer(item.x, item.y);
                const alpha = this.getVisibilityAlpha(dist);
                item.sprite.setAlpha(alpha);
                item.sprite.setVisible(alpha > 0);
            }
        });
    }
    
    // ============================================
    // CONTROLADOR VIRTUAL
    // ============================================
    
    createVirtualController() {
        // Inicializar variables de estado previo para detectar "JustDown"
        this.lastVirtualLeft = false;
        this.lastVirtualRight = false;
        this.lastVirtualUp = false;
        this.lastVirtualDown = false;
        
        // Tamaño más pequeño y minimalista
        const buttonSize = IS_SMALL_MOBILE ? 50 : 55;
        const buttonSpacing = IS_SMALL_MOBILE ? 3 : 5;
        
        // Posición base del controlador (esquina inferior DERECHA) - MÁS BAJO
        const baseX = SCREEN_WIDTH - (buttonSize * 3 + buttonSpacing * 2) - buttonSpacing;
        const baseY = SCREEN_HEIGHT - (buttonSize * 2 + buttonSpacing) - buttonSpacing; // Cambiado de 3 a 2 botones de altura
        
        // Crear contenedor para los botones - GUARDAR REFERENCIA
        this.virtualControllerContainer = this.add.container(0, 0);
        this.virtualControllerContainer.setScrollFactor(0);
        this.virtualControllerContainer.setDepth(2000);
        
        // Función helper para crear un botón minimalista
        const createButton = (x, y, icon) => {
            // Fondo del botón más transparente y minimalista
            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.3); // Más transparente
            bg.fillRoundedRect(x, y, buttonSize, buttonSize, 8);
            bg.lineStyle(1, 0xFFFFFF, 0.5); // Borde más sutil
            bg.strokeRoundedRect(x, y, buttonSize, buttonSize, 8);
            
            // Texto del icono más pequeño
            const text = this.add.text(x + buttonSize / 2, y + buttonSize / 2, icon, {
                fontSize: IS_SMALL_MOBILE ? '20px' : '24px',
                fill: '#FFFFFF',
                alpha: 0.8
            });
            text.setOrigin(0.5);
            
            // Zona interactiva
            const zone = this.add.zone(x, y, buttonSize, buttonSize);
            zone.setOrigin(0);
            zone.setInteractive();
            zone.setScrollFactor(0);
            
            this.virtualControllerContainer.add([bg, text, zone]);
            
            return { bg, text, zone };
        };
        
        // Crear botones direccionales en forma de cruz compacta
        // Arriba
        const upButton = createButton(
            baseX + buttonSize + buttonSpacing,
            baseY,
            '▲'
        );
        
        // Izquierda
        const leftButton = createButton(
            baseX,
            baseY + buttonSize + buttonSpacing,
            '◀'
        );
        
        // Centro - AHORA ES EL BOTÓN DE ABAJO
        const downButton = createButton(
            baseX + buttonSize + buttonSpacing,
            baseY + buttonSize + buttonSpacing,
            '▼'
        );
        
        // Derecha
        const rightButton = createButton(
            baseX + buttonSize * 2 + buttonSpacing * 2,
            baseY + buttonSize + buttonSpacing,
            '▶'
        );
        
        // Configurar eventos para cada botón
        const setupButton = (button, direction) => {
            // Efecto visual al presionar - más sutil
            const highlightButton = () => {
                button.bg.clear();
                button.bg.fillStyle(0x4444FF, 0.5); // Más transparente
                button.bg.fillRoundedRect(button.zone.x, button.zone.y, buttonSize, buttonSize, 8);
                button.bg.lineStyle(2, 0xFFFFFF, 0.8); // Borde más sutil
                button.bg.strokeRoundedRect(button.zone.x, button.zone.y, buttonSize, buttonSize, 8);
                button.text.setScale(1.05); // Escala más sutil
                button.text.setAlpha(1);
            };
            
            const normalButton = () => {
                button.bg.clear();
                button.bg.fillStyle(0x000000, 0.3); // Más transparente
                button.bg.fillRoundedRect(button.zone.x, button.zone.y, buttonSize, buttonSize, 8);
                button.bg.lineStyle(1, 0xFFFFFF, 0.5); // Borde más sutil
                button.bg.strokeRoundedRect(button.zone.x, button.zone.y, buttonSize, buttonSize, 8);
                button.text.setScale(1);
                button.text.setAlpha(0.8);
            };
            
            button.zone.on('pointerdown', () => {
                switch(direction) {
                    case 'left':
                        virtualLeft = true;
                        break;
                    case 'right':
                        virtualRight = true;
                        break;
                    case 'up':
                        virtualUp = true;
                        break;
                    case 'down':
                        virtualDown = true;
                        break;
                }
                highlightButton();
            });
            
            button.zone.on('pointerup', () => {
                switch(direction) {
                    case 'left':
                        virtualLeft = false;
                        break;
                    case 'right':
                        virtualRight = false;
                        break;
                    case 'up':
                        virtualUp = false;
                        break;
                    case 'down':
                        virtualDown = false;
                        break;
                }
                normalButton();
            });
            
            button.zone.on('pointerout', () => {
                switch(direction) {
                    case 'left':
                        virtualLeft = false;
                        break;
                    case 'right':
                        virtualRight = false;
                        break;
                    case 'up':
                        virtualUp = false;
                        break;
                    case 'down':
                        virtualDown = false;
                        break;
                }
                normalButton();
            });
            
            // También manejar pointerover para arrastrar el dedo
            button.zone.on('pointerover', (pointer) => {
                if (pointer.isDown) {
                    switch(direction) {
                        case 'left':
                            virtualLeft = true;
                            break;
                        case 'right':
                            virtualRight = true;
                            break;
                        case 'up':
                            virtualUp = true;
                            break;
                        case 'down':
                            virtualDown = true;
                            break;
                    }
                    highlightButton();
                }
            });
        };
        
        // Configurar todos los botones
        setupButton(leftButton, 'left');
        setupButton(rightButton, 'right');
        setupButton(upButton, 'up');
        setupButton(downButton, 'down');
        
        // Workaround para el bug de botones atascados
        this.input.on('pointerup', () => {
            virtualLeft = false;
            virtualRight = false;
            virtualUp = false;
            virtualDown = false;
        });
    }
    
    update() {
        if (!this.canMove) return;

        let moved = false;
        let dx = 0;
        let dy = 0;

        // Input del teclado
        if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            dx = -1;
            moved = true;
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            dx = 1;
            moved = true;
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            dy = -1;
            moved = true;
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            dy = 1;
            moved = true;
        }
        
        // Input del controlador virtual (solo si no se ha movido con el teclado)
        if (!moved && IS_MOBILE) {
            if (virtualLeft && !this.lastVirtualLeft) {
                dx = -1;
                moved = true;
            } else if (virtualRight && !this.lastVirtualRight) {
                dx = 1;
                moved = true;
            } else if (virtualUp && !this.lastVirtualUp) {
                dy = -1;
                moved = true;
            } else if (virtualDown && !this.lastVirtualDown) {
                dy = 1;
                moved = true;
            }
            
            // Guardar estado anterior para detectar "JustDown"
            this.lastVirtualLeft = virtualLeft;
            this.lastVirtualRight = virtualRight;
            this.lastVirtualUp = virtualUp;
            this.lastVirtualDown = virtualDown;
        }

        if (moved) {
            this.playerTurn(dx, dy);
        }
    }
    
    render() {
        this.tileGraphics.clear();
        this.fogGraphics.clear();

        const startX = Math.max(0, Math.floor(this.cameras.main.scrollX / TILE_SIZE));
        const endX = Math.min(this.mapWidth, Math.ceil((this.cameras.main.scrollX + SCREEN_WIDTH) / TILE_SIZE));
        const startY = Math.max(0, Math.floor(this.cameras.main.scrollY / TILE_SIZE));
        const endY = Math.min(this.mapHeight, Math.ceil((this.cameras.main.scrollY + SCREEN_HEIGHT) / TILE_SIZE));

        // Dibujar tiles con sistema de visión
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                const tile = this.map[y][x];
                
                // Calcular visibilidad basada en distancia al jugador
                const distance = this.getDistanceToPlayer(x, y);
                const alpha = this.getVisibilityAlpha(distance);
                
                // No dibujar si está completamente invisible
                if (alpha <= 0) continue;

                // Dibujar suelo
                if (tile === TILE.FLOOR) {
                    this.tileGraphics.fillStyle(0xe8dcc0, alpha);
                    this.tileGraphics.fillRect(px, py, TILE_SIZE, TILE_SIZE);
                }

                // Dibujar paredes solo si están adyacentes a un piso
                if (tile === TILE.WALL && this.isAdjacentToFloor(x, y)) {
                    this.tileGraphics.fillStyle(0x444444, alpha);
                    this.tileGraphics.fillRoundedRect(px, py, TILE_SIZE, TILE_SIZE, 4);
                }
            }
        }

        // Posicionar jugador
        this.entitySprites.player.setPosition(
            this.player.x * TILE_SIZE + TILE_SIZE / 2,
            this.player.y * TILE_SIZE + TILE_SIZE / 2 + 2
        );
        this.entitySprites.player.setAlpha(1); // Jugador siempre visible

        // Posicionar salida
        this.entitySprites.exit.setPosition(
            this.exit.x * TILE_SIZE + TILE_SIZE / 2,
            this.exit.y * TILE_SIZE + TILE_SIZE / 2 + 2
        );

        // Posicionar contenedores
        this.containers.forEach(container => {
            const sprite = this.entitySprites.containers[container.id];
            sprite.setPosition(
                container.x * TILE_SIZE + TILE_SIZE / 2,
                container.y * TILE_SIZE + TILE_SIZE / 2 + 2
            );
        });

        // Posicionar enemigos
        this.enemies.forEach(enemy => {
            const sprite = this.entitySprites.enemies[enemy.id];
            sprite.setPosition(
                enemy.x * TILE_SIZE + TILE_SIZE / 2,
                enemy.y * TILE_SIZE + TILE_SIZE / 2 + 2
            );
        });

        // Posicionar items
        this.items.forEach(item => {
            if (item.sprite) {
                item.sprite.setPosition(
                    item.x * TILE_SIZE + TILE_SIZE / 2,
                    item.y * TILE_SIZE + TILE_SIZE / 2 + 2
                );
            }
        });
    }

    centerCamera() {
        const targetX = this.player.x * TILE_SIZE + TILE_SIZE / 2;
        const targetY = this.player.y * TILE_SIZE + TILE_SIZE / 2;
        this.cameras.main.centerOn(targetX, targetY);
    }

    createUI() {
        this.healthBarGraphics = this.add.graphics();
        this.healthBarGraphics.setScrollFactor(0);
        this.healthBarGraphics.setDepth(100);

        // Posición del log adaptada a móvil
        const logY = IS_MOBILE ? SCREEN_HEIGHT - 120 : SCREEN_HEIGHT - 50;
        const logWidth = IS_MOBILE ? SCREEN_WIDTH - 20 : 600;
        const logFontSize = IS_SMALL_MOBILE ? '11px' : (IS_MOBILE ? '12px' : '14px');
        
        this.logText = this.add.text(10, logY, '', {
            fontSize: logFontSize,
            fill: '#333333',
            backgroundColor: '#FFFFF4E0',
            padding: { x: IS_MOBILE ? 5 : 10, y: 5 },
            wordWrap: { width: logWidth }
        });
        this.logText.setScrollFactor(0);
        this.logText.setDepth(100);
        this.logText.setVisible(!IS_MOBILE); // Ocultar en móvil

        // Emoji del jugador en UI usando Twemoji
        const emojiSize = IS_SMALL_MOBILE ? 24 : (IS_MOBILE ? 28 : 32);
        this.playerHealthEmoji = this.add.sprite(0, 0, 'emoji_player');
        this.playerHealthEmoji.setDisplaySize(emojiSize, emojiSize);
        this.playerHealthEmoji.setOrigin(0, 0.5);
        this.playerHealthEmoji.setScrollFactor(0);
        this.playerHealthEmoji.setDepth(101);

        const xpFontSize = IS_SMALL_MOBILE ? '14px' : (IS_MOBILE ? '16px' : '20px');
        this.xpText = this.add.text(0, 0, '', {
            fontSize: xpFontSize,
            fill: '#C41E3A',
            fontStyle: 'bold',
            stroke: '#FFD700',
            strokeThickness: IS_MOBILE ? 1 : 2
        });
        this.xpText.setScrollFactor(0);
        this.xpText.setDepth(101);

        const enemyEmojiSize = IS_SMALL_MOBILE ? 28 : (IS_MOBILE ? 32 : 36);
        this.enemyHealthSprite = this.add.sprite(0, 0, 'emoji_player'); // Temporal, se cambiará dinámicamente
        this.enemyHealthSprite.setDisplaySize(enemyEmojiSize, enemyEmojiSize);
        this.enemyHealthSprite.setOrigin(0, 0.5);
        this.enemyHealthSprite.setScrollFactor(0);
        this.enemyHealthSprite.setDepth(101);
        this.enemyHealthSprite.setVisible(false);

        this.equippedGearTexts = [];
        this.basketItemsTexts = [];
        
        // Iconos adaptados a móvil
        const iconSize = IS_SMALL_MOBILE ? 30 : (IS_MOBILE ? 35 : 40);
        const basketIconX = IS_MOBILE ? 20 : 35;
        const basketIconY = IS_MOBILE ? 60 : 78;
        
        // Icono de CESTA (posición adaptada)
        this.basketIcon = this.add.sprite(basketIconX, basketIconY, 'emoji_basket_icon');
        this.basketIcon.setDisplaySize(iconSize, iconSize);
        this.basketIcon.setScrollFactor(0);
        this.basketIcon.setDepth(101);
        
        // Contador de notificaciones de la cesta (círculo amarillo con número)
        const counterSize = IS_SMALL_MOBILE ? 18 : (IS_MOBILE ? 20 : 22);
        const counterOffsetX = iconSize * 0.35; // Posición en esquina superior derecha
        const counterOffsetY = -iconSize * 0.35;
        
        // Círculo amarillo de fondo
        this.basketCounterCircle = this.add.graphics();
        this.basketCounterCircle.setScrollFactor(0);
        this.basketCounterCircle.setDepth(102);
        
        // Texto del contador
        const counterFontSize = IS_SMALL_MOBILE ? '11px' : (IS_MOBILE ? '12px' : '14px');
        this.basketCounterText = this.add.text(
            basketIconX + counterOffsetX,
            basketIconY + counterOffsetY,
            '0',
            {
                fontSize: counterFontSize,
                fill: '#000000',
                fontStyle: 'bold'
            }
        );
        this.basketCounterText.setOrigin(0.5);
        this.basketCounterText.setScrollFactor(0);
        this.basketCounterText.setDepth(103);
        
        // Icono de EQUIPAMIENTO (posición adaptada)
        const equipIconX = IS_MOBILE ? SCREEN_WIDTH - 20 : SCREEN_WIDTH - 35;
        const equipIconY = IS_MOBILE ? 60 : 78;
        this.equipmentIcon = this.add.sprite(equipIconX, equipIconY, 'emoji_weapons_icon');
        this.equipmentIcon.setDisplaySize(iconSize, iconSize);
        this.equipmentIcon.setScrollFactor(0);
        this.equipmentIcon.setDepth(101);
        
        const statsFontSize = IS_SMALL_MOBILE ? '12px' : (IS_MOBILE ? '14px' : '16px');
        this.statsText = this.add.text(0, 0, '', {
            fontSize: statsFontSize,
            fill: '#333333',
            backgroundColor: '#FFFFF4CC',
            padding: { x: IS_MOBILE ? 3 : 5, y: 3 }
        });
        this.statsText.setScrollFactor(0);
        this.statsText.setDepth(101);
        this.statsText.setVisible(!IS_MOBILE); // Ocultar en móvil

        this.updateUI();
    }

    updateUI() {
        this.healthBarGraphics.clear();

        // Tamaños adaptados a la pantalla
        const tileSize = IS_SMALL_MOBILE ? 16 : (IS_MOBILE ? 20 : 24);
        const gameWidth = SCREEN_WIDTH;
        const playerBarWidth = this.player.maxHp * (tileSize + 2);
        const playerStartX = (gameWidth - playerBarWidth) / 2;
        const playerY = 15;

        const emojiOffset = IS_SMALL_MOBILE ? 30 : (IS_MOBILE ? 35 : 45);
        this.playerHealthEmoji.setPosition(playerStartX - emojiOffset, playerY + tileSize/2);

        this.xpText.setText(`⭐ ${this.player.xp}/${this.player.xpToNextLevel} (${this.player.skillPoints})`);
        this.xpText.setPosition(playerStartX + playerBarWidth + (IS_MOBILE ? 5 : 10), playerY + 2);

        for (let i = 0; i < this.player.maxHp; i++) {
            const x = playerStartX + i * (tileSize + 2);
            this.healthBarGraphics.fillStyle(i < this.player.hp ? 0x1A6A00 : 0x444444); 
            this.healthBarGraphics.fillRoundedRect(x, playerY, tileSize, tileSize, 4);
        }

        // Posición de stats adaptada
        const equipmentX = IS_MOBILE ? SCREEN_WIDTH - 80 : SCREEN_WIDTH - 150; 
        const statsY = IS_MOBILE ? SCREEN_HEIGHT - 330 : 60;
        
        this.statsText.setPosition(equipmentX, statsY);
        this.statsText.setText(
            `ATK: ${this.player.currentAttack}\nDEF: ${this.player.currentDefense}\nHP: ${this.player.hp}/${this.player.maxHp}`
        );

        // Actualizar iconos de equipo (usando Twemoji)
        const equipLength = this.equippedGear.length; 
        const prevEquipLength = this.equippedGearTexts.length;
        
        if (equipLength !== prevEquipLength) {
            for (let i = 0; i < prevEquipLength; i++) {
                this.equippedGearTexts[i].destroy();
            }
            this.equippedGearTexts = [];

            const itemSize = IS_SMALL_MOBILE ? 28 : (IS_MOBILE ? 32 : 36);
            const equipmentIconX = IS_MOBILE ? SCREEN_WIDTH - 20 : SCREEN_WIDTH - 35;
            const equipmentStartY = IS_MOBILE ? 100 : 120;
            const itemSpacing = IS_SMALL_MOBILE ? 38 : (IS_MOBILE ? 42 : 50);
            
            for (let i = 0; i < equipLength; i++) {
                const item = this.equippedGear[i];
                let itemSprite;
                
                if (item.emojiKey && this.textures.exists(`emoji_${item.emojiKey}`)) {
                    itemSprite = this.add.sprite(
                        equipmentIconX,
                        equipmentStartY + i * itemSpacing,
                        `emoji_${item.emojiKey}`
                    );
                    itemSprite.setDisplaySize(itemSize, itemSize);
                } else {
                    const fontSize = IS_SMALL_MOBILE ? '28px' : (IS_MOBILE ? '32px' : '36px');
                    itemSprite = this.add.text(
                        equipmentIconX,
                        equipmentStartY + i * itemSpacing,
                        item.emoji,
                        { 
                            fontSize: fontSize,
                            lineSpacing: 0,
                            padding: { top: 8, bottom: 2 }
                        }
                    );
                    itemSprite.setOrigin(0, 0.5);
                }
                
                itemSprite.setScrollFactor(0);
                itemSprite.setDepth(101);
                this.equippedGearTexts.push(itemSprite);
            }
        }
        
        // Productos de la cesta (usando Twemoji)
        const basketLength = this.basketItems.length;
        const prevBasketLength = this.basketItemsTexts.length;
        
        // Actualizar contador de notificaciones de la cesta
        const counterSize = IS_SMALL_MOBILE ? 18 : (IS_MOBILE ? 20 : 22);
        const basketIconX = IS_MOBILE ? 20 : 35;
        const basketIconY = IS_MOBILE ? 60 : 78;
        const iconSize = IS_SMALL_MOBILE ? 30 : (IS_MOBILE ? 35 : 40);
        const counterOffsetX = iconSize * 0.35;
        const counterOffsetY = -iconSize * 0.35;
        
        this.basketCounterCircle.clear();
        this.basketCounterCircle.fillStyle(0xFFD700, 1); // Amarillo dorado
        this.basketCounterCircle.fillCircle(
            basketIconX + counterOffsetX,
            basketIconY + counterOffsetY,
            counterSize / 2
        );
        
        this.basketCounterText.setText(`${basketLength}`);
        this.basketCounterText.setPosition(
            basketIconX + counterOffsetX,
            basketIconY + counterOffsetY
        );
        
        if (basketLength !== prevBasketLength) {
            for (let i = 0; i < prevBasketLength; i++) {
                this.basketItemsTexts[i].destroy();
            }
            this.basketItemsTexts = [];

            const itemSize = IS_SMALL_MOBILE ? 28 : (IS_MOBILE ? 32 : 36);
            const basketX = IS_MOBILE ? 20 : 35;
            const basketStartY = IS_MOBILE ? 100 : 120;
            const itemSpacing = IS_SMALL_MOBILE ? 38 : (IS_MOBILE ? 42 : 50);
            
            for (let i = 0; i < basketLength; i++) {
                const item = this.basketItems[i];
                let itemSprite;
                
                if (item.emojiKey && this.textures.exists(`emoji_${item.emojiKey}`)) {
                    itemSprite = this.add.sprite(
                        basketX,
                        basketStartY + i * itemSpacing,
                        `emoji_${item.emojiKey}`
                    );
                    itemSprite.setDisplaySize(itemSize, itemSize);
                } else {
                    const fontSize = IS_SMALL_MOBILE ? '28px' : (IS_MOBILE ? '32px' : '36px');
                    itemSprite = this.add.text(
                        basketX,
                        basketStartY + i * itemSpacing,
                        item.emoji,
                        { 
                            fontSize: fontSize,
                            lineSpacing: 0,
                            padding: { top: 8, bottom: 2 }
                        }
                    );
                    itemSprite.setOrigin(0, 0.5);
                }
                
                itemSprite.setScrollFactor(0);
                itemSprite.setDepth(101);
                this.basketItemsTexts.push(itemSprite);
            }
        }

        if (this.enemyInCombat) {
            const enemyY = playerY + tileSize + (IS_MOBILE ? 10 : 15);
            const enemyBarWidth = this.enemyInCombat.maxHp * (tileSize + 2);
            const enemyStartX = (gameWidth - enemyBarWidth) / 2;

            const enemyEmojiOffset = IS_SMALL_MOBILE ? 30 : (IS_MOBILE ? 35 : 42);
            const enemyEmojiSize = IS_SMALL_MOBILE ? 28 : (IS_MOBILE ? 32 : 36);
            
            // Intentar usar logo primero, luego emoji sprite, luego fallback
            if (this.enemyInCombat.logo && this.textures.exists(this.enemyInCombat.logo)) {
                this.enemyHealthSprite.setTexture(this.enemyInCombat.logo);
            } else if (this.textures.exists(`emoji_${this.enemyInCombat.emojiKey}`)) {
                this.enemyHealthSprite.setTexture(`emoji_${this.enemyInCombat.emojiKey}`);
            }
            
            this.enemyHealthSprite.setDisplaySize(enemyEmojiSize, enemyEmojiSize);
            this.enemyHealthSprite.setPosition(enemyStartX - enemyEmojiOffset, enemyY + tileSize/2);
            this.enemyHealthSprite.setVisible(true);

            for (let i = 0; i < this.enemyInCombat.maxHp; i++) {
                const x = enemyStartX + i * (tileSize + 2);
                this.healthBarGraphics.fillStyle(i < this.enemyInCombat.hp ? 0xff0000 : 0x444444);
                this.healthBarGraphics.fillRoundedRect(x, enemyY, tileSize, tileSize, 4);
            }
        } else {
            this.enemyHealthSprite.setVisible(false);
        }
    }

    addMessage(message) {
        this.messageLog.unshift(message);
        if (this.messageLog.length > 3) {
            this.messageLog.pop();
        }
        this.logText.setText(this.messageLog.join('\n'));
    }

    victory() {
        this.canMove = false;
        
        // Ocultar controlador virtual en móviles
        if (IS_MOBILE && this.virtualControllerContainer) {
            this.virtualControllerContainer.setVisible(false);
        }
        
        // Guardar resultado en localStorage
        this.saveGameResult(true);
        
        // Mostrar pantalla de resumen
        this.showSummaryScreen(true);
    }

    gameOver() {
        this.canMove = false;
        
        // Ocultar controlador virtual en móviles
        if (IS_MOBILE && this.virtualControllerContainer) {
            this.virtualControllerContainer.setVisible(false);
        }
        
        // Guardar resultado en localStorage
        this.saveGameResult(false);
        
        // Mostrar pantalla de resumen
        this.showSummaryScreen(false);
    }
    
    saveGameResult(won) {
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        
        const gameData = {
            date: dateKey,
            seed: this.dailySeed,
            won: won,
            steps: this.steps,
            hp: this.player.hp,
            maxHp: this.player.maxHp,
            xp: this.player.xp,
            level: this.player.skillPoints,
            defeatedEnemies: this.defeatedEnemies,
            killerEnemy: this.killerEnemy,
            completed: true,
            timestamp: today.getTime()
        };
        
        localStorage.setItem('cestaquest_' + dateKey, JSON.stringify(gameData));
        localStorage.setItem('cestaquest_last_played', dateKey);
    }
    
    showSummaryScreen(won) {
        // Overlay oscuro (sin interacción) - más claro
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.70); // Cambiado de 0.85 a 0.70 para más claridad
        overlay.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        overlay.setScrollFactor(0);
        overlay.setDepth(1000);
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT), Phaser.Geom.Rectangle.Contains);
        // Importante: hacer que el overlay NO bloquee los clics de sus hijos
        overlay.disableInteractive();
        
        // Tamaños responsive
        const titleFontSize = IS_SMALL_MOBILE ? '28px' : (IS_MOBILE ? '36px' : '56px');
        const dateFontSize = IS_SMALL_MOBILE ? '14px' : (IS_MOBILE ? '18px' : '24px');
        const iconSize = IS_SMALL_MOBILE ? 32 : (IS_MOBILE ? 40 : 48);
        const spacing = IS_SMALL_MOBILE ? 40 : (IS_MOBILE ? 50 : 60);
        const healthFontSize = IS_SMALL_MOBILE ? '20px' : (IS_MOBILE ? '26px' : '32px');
        const countdownFontSize = IS_SMALL_MOBILE ? '12px' : (IS_MOBILE ? '14px' : '18px');
        const buttonFontSize = IS_SMALL_MOBILE ? '16px' : (IS_MOBILE ? '18px' : '24px');
        const stepsFontSize = IS_SMALL_MOBILE ? '20px' : (IS_MOBILE ? '24px' : '28px');
        
        // Contenedor principal
        const containerX = SCREEN_WIDTH / 2;
        const containerY = SCREEN_HEIGHT / 2;
        const container = this.add.container(containerX, containerY);
        container.setScrollFactor(0);
        container.setDepth(1001);
        
        // Título del juego
        const titleY = IS_MOBILE ? -SCREEN_HEIGHT * 0.35 : -220;
        const title = this.add.text(0, titleY, 'CESTAQUEST', {
            fontSize: titleFontSize,
            fill: '#FFFFFF',
            fontStyle: 'bold',
            stroke: '#C41E3A',
            strokeThickness: IS_MOBILE ? 3 : 6
        });
        title.setOrigin(0.5);
        container.add(title);
        
        // Fecha
        const today = new Date();
        const dateY = IS_MOBILE ? titleY + 40 : -170;
        const dateText = this.add.text(0, dateY, today.toLocaleDateString('es-ES'), {
            fontSize: dateFontSize,
            fill: '#FFD700'
        });
        dateText.setOrigin(0.5);
        container.add(dateText);
        
        // Línea 1: Estado del héroe (CENTRADO)
        let yPos = IS_MOBILE ? dateY + 50 : -110;
        
        // Calcular ancho total para centrar
        let totalWidth;
        if (won) {
            // héroe + árbol + huellas + número
            totalWidth = iconSize + spacing + iconSize + spacing + iconSize + 40;
        } else {
            // héroe + calavera + asesino + huellas + número
            totalWidth = iconSize + spacing + iconSize + spacing + iconSize + spacing + iconSize + 40;
        }
        
        let xOffset = -totalWidth / 2;
        
        // Emoji del héroe (vivo o muerto)
        const heroEmoji = this.add.sprite(xOffset + iconSize/2, yPos, won ? 'emoji_player' : 'emoji_player_hurt');
        heroEmoji.setDisplaySize(iconSize, iconSize);
        container.add(heroEmoji);
        xOffset += iconSize + spacing;
        
        // Resultado (árbol o calavera + asesino)
        if (won) {
            const treeEmoji = this.add.sprite(xOffset + iconSize/2, yPos, 'emoji_exit');
            treeEmoji.setDisplaySize(iconSize, iconSize);
            container.add(treeEmoji);
            xOffset += iconSize + spacing;
        } else {
            const skullEmoji = this.add.sprite(xOffset + iconSize/2, yPos, 'emoji_skull');
            skullEmoji.setDisplaySize(iconSize, iconSize);
            container.add(skullEmoji);
            xOffset += iconSize + spacing;
            
            // Logo del enemigo asesino
            if (this.killerEnemy && this.killerEnemy.logo) {
                if (this.textures.exists(this.killerEnemy.logo)) {
                    const killerSprite = this.add.sprite(xOffset + iconSize/2, yPos, this.killerEnemy.logo);
                    killerSprite.setDisplaySize(iconSize, iconSize);
                    container.add(killerSprite);
                } else if (this.textures.exists(`emoji_${this.killerEnemy.emojiKey}`)) {
                    const killerSprite = this.add.sprite(xOffset + iconSize/2, yPos, `emoji_${this.killerEnemy.emojiKey}`);
                    killerSprite.setDisplaySize(iconSize, iconSize);
                    container.add(killerSprite);
                }
                xOffset += iconSize + spacing;
            }
        }
        
        // Pasos
        const footprintEmoji = this.add.sprite(xOffset + iconSize/2, yPos, 'emoji_footprints');
        footprintEmoji.setDisplaySize(iconSize, iconSize);
        container.add(footprintEmoji);
        xOffset += iconSize + 10;
        
        const stepsText = this.add.text(xOffset, yPos, this.steps.toString(), {
            fontSize: stepsFontSize,
            fill: '#FFFFFF',
            fontStyle: 'bold'
        });
        stepsText.setOrigin(0, 0.5);
        container.add(stepsText);
        
        // Línea 2: Barra de vida (escala 0-5)
        yPos += IS_MOBILE ? 60 : 70;
        const healthScale = Math.max(0, Math.ceil((this.player.hp / this.player.maxHp) * 5));
        let healthBar = '';
        for (let i = 0; i < 5; i++) {
            healthBar += i < healthScale ? '🟩' : '⬜';
        }
        const healthText = this.add.text(0, yPos, healthBar, {
            fontSize: healthFontSize
        });
        healthText.setOrigin(0.5);
        container.add(healthText);
        
        // Línea 3: Enemigos derrotados (CENTRADO)
        yPos += IS_MOBILE ? 60 : 70;
        
        // Calcular ancho total de los enemigos
        const numEnemies = Math.min(this.defeatedEnemies.length, 6);
        const enemyTotalWidth = iconSize + 10 + (numEnemies * iconSize) + ((numEnemies - 1) * 10);
        let enemyXOffset = -enemyTotalWidth / 2;
        
        const weaponsIcon = this.add.sprite(enemyXOffset + iconSize/2, yPos, 'emoji_weapons_icon');
        weaponsIcon.setDisplaySize(iconSize, iconSize);
        container.add(weaponsIcon);
        enemyXOffset += iconSize + 10;
        
        this.defeatedEnemies.forEach((enemy, index) => {
            if (index < 6) {
                let enemySprite;
                
                // Intentar cargar logo primero
                if (enemy.logo && this.textures.exists(enemy.logo)) {
                    enemySprite = this.add.sprite(enemyXOffset + iconSize/2, yPos, enemy.logo);
                    enemySprite.setDisplaySize(iconSize, iconSize);
                } else if (this.textures.exists(`emoji_${enemy.emojiKey}`)) {
                    enemySprite = this.add.sprite(enemyXOffset + iconSize/2, yPos, `emoji_${enemy.emojiKey}`);
                    enemySprite.setDisplaySize(iconSize, iconSize);
                } else {
                    const enemyEmojiFontSize = IS_SMALL_MOBILE ? '32px' : (IS_MOBILE ? '36px' : '42px');
                    enemySprite = this.add.text(enemyXOffset + iconSize/2, yPos, enemy.emoji, {
                        fontSize: enemyEmojiFontSize
                    });
                    enemySprite.setOrigin(0.5);
                }
                container.add(enemySprite);
                enemyXOffset += iconSize + 10;
            }
        });
        
        // Cuenta atrás para el próximo día
        yPos += IS_MOBILE ? 60 : 70;
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - Date.now();
        const hours = Math.floor(timeUntilMidnight / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeUntilMidnight % (1000 * 60)) / 1000);
        
        const countdownText = this.add.text(0, yPos, 
            `Nueva mazmorra en: ${hours}h ${minutes}m ${seconds}s`, {
            fontSize: countdownFontSize,
            fill: '#FFD700'
        });
        countdownText.setOrigin(0.5);
        container.add(countdownText);
        
        // Actualizar cuenta atrás cada segundo
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                const now = Date.now();
                const remaining = midnight.getTime() - now;
                if (remaining > 0) {
                    const h = Math.floor(remaining / (1000 * 60 * 60));
                    const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                    const s = Math.floor((remaining % (1000 * 60)) / 1000);
                    countdownText.setText(`Nueva mazmorra en: ${h}h ${m}m ${s}s`);
                } else {
                    countdownText.setText('¡Nueva mazmorra disponible!');
                }
            },
            loop: true
        });
        
        // Botón de compartir (FUERA DEL CONTAINER para evitar problemas)
        yPos += IS_MOBILE ? 50 : 60;
        const buttonPadding = IS_MOBILE ? { x: 15, y: 8 } : { x: 20, y: 10 };
        const shareButton = this.add.text(containerX, containerY + yPos, '📋 COMPARTIR RESULTADO', {
            fontSize: buttonFontSize,
            fill: '#FFFFFF',
            backgroundColor: '#C41E3A',
            padding: buttonPadding
        });
        shareButton.setOrigin(0.5);
        shareButton.setScrollFactor(0);
        shareButton.setDepth(1002);
        shareButton.setInteractive({ useHandCursor: true });
        
        shareButton.on('pointerdown', () => {
            this.copyResultToClipboard(won);
            shareButton.setText('✅ ¡COPIADO!');
            this.time.delayedCall(2000, () => {
                shareButton.setText('📋 COMPARTIR RESULTADO');
            });
        });
        
        shareButton.on('pointerover', () => {
            shareButton.setScale(1.05);
        });
        
        shareButton.on('pointerout', () => {
            shareButton.setScale(1);
        });
    }
    
    copyResultToClipboard(won) {
        console.log('📋 Intentando copiar resultado...');
        console.log('📋 Estado ganador:', won);
        
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        
        // Construir el texto para compartir
        let shareText = `#CestaQuest ${dateStr}\n`;
        
        // Línea 1: Héroe + resultado + pasos
        shareText += won ? '🙂' : '😵';
        
        if (won) {
            shareText += ' 🎄';
        } else if (this.killerEnemy) {
            shareText += ` 💀 ${this.killerEnemy.name}`;
        } else {
            shareText += ' 💀';
        }
        
        shareText += ` 👣${this.steps}\n`;
        
        // Línea 2: Barra de vida
        const healthScale = Math.max(0, Math.ceil((this.player.hp / this.player.maxHp) * 5));
        for (let i = 0; i < 5; i++) {
            shareText += i < healthScale ? '🟩' : '⬜';
        }
        shareText += '\n';
        
        // Línea 3: Enemigos derrotados (nombres en lugar de emojis)
        if (this.defeatedEnemies.length > 0) {
            const enemyNames = this.defeatedEnemies.map(e => e.name).join(', ');
            shareText += `He acabado con: ${enemyNames}\n`;
        }
        
        // URL (placeholder por ahora)
        shareText += '\nhttps://cestaquest.com';
        
        console.log('📋 Texto a copiar:', shareText);
        console.log('📋 Clipboard API disponible:', !!navigator.clipboard);
        
        // Copiar al portapapeles
        if (navigator.clipboard && navigator.clipboard.writeText) {
            console.log('📋 Usando Clipboard API...');
            navigator.clipboard.writeText(shareText).then(() => {
                console.log('✅ Resultado copiado al portapapeles');
            }).catch(err => {
                console.error('❌ Error al copiar:', err);
                // Fallback: mostrar el texto para copiar manualmente
                console.log('📋 Mostrando alert como fallback');
                alert('Copia este texto:\n\n' + shareText);
            });
        } else {
            console.log('📋 Clipboard API no disponible, usando alert');
            // Fallback para navegadores antiguos
            alert('Copia este texto:\n\n' + shareText);
        }
    }
    
    showAlreadyPlayedScreen(gameData) {
        // Restaurar datos del juego guardado
        this.steps = gameData.steps;
        this.player = {
            hp: gameData.hp,
            maxHp: gameData.maxHp,
            xp: gameData.xp,
            skillPoints: gameData.level
        };
        this.defeatedEnemies = gameData.defeatedEnemies || [];
        this.killerEnemy = gameData.killerEnemy || null;
        
        // Cargar texturas necesarias para la pantalla
        const emojiAssets = {
            'player': 'player.png',
            'player_hurt': 'player_hurt.png',
            'exit': 'exit.png',
            'skull': 'skull.png',
            'footprints': 'footprints.png',
            'weapons_icon': 'weapons_icon.png'
        };
        
        // Cargar logos de IAs
        const logoFiles = {
            'gemini': 'gemini.svg',
            'copilot': 'copilot.png',
            'openai': 'openai.svg',
            'claude': 'claude.svg',  
            'apple': 'apple.svg',
            'deepseek': 'deepseek.svg',
            'grok': 'grok.svg'
        };
        
        for (const [key, filename] of Object.entries(logoFiles)) {
            this.load.image(key, `assets/logos/${filename}`);
        }
        
        // Cargar emojis base
        for (const [key, filename] of Object.entries(emojiAssets)) {
            this.load.image(`emoji_${key}`, `assets/emojis/${filename}`);
        }
        
        this.load.once('complete', () => {
            this.showSummaryScreen(gameData.won);
        });
        
        this.load.start();
    }
}

// ============================================
// CONFIGURACIÓN DE PHASER
// ============================================

const config = {
    type: Phaser.AUTO,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#FFFFFF', 
    scene: [GameScene],
    pixelArt: false,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

const game = new Phaser.Game(config);