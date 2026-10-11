let scene, camera, renderer;
let peer, conn;
let myCar, enemyCar;
let isHost = false;
let myRole = 'hider';
let keys = { w: false, a: false, s: false, d: false, space: false };

// Физика машины и дрифта
const physics = (car) => {
    car.speed = car.speed || 0;
    car.angle = car.angle || 0;
    let accel = 0.006;
    let friction = 0.98;
    let maxSpeed = 0.55;
    let turnSpeed = 0.035;

    if (keys.w) car.speed += accel;
    if (keys.s) car.speed -= accel;
    
    if (keys.space) {
        friction = 0.995; // Дрифт (уменьшенное боковое трение)
        turnSpeed = 0.045;
    }

    car.speed *= friction;
    if (car.speed > maxSpeed) car.speed = maxSpeed;
    if (car.speed < -maxSpeed / 2) car.speed = -maxSpeed / 2;

    if (Math.abs(car.speed) > 0.001) {
        if (keys.a) car.angle += turnSpeed * Math.sign(car.speed);
        if (keys.d) car.angle -= turnSpeed * Math.sign(car.speed);
    }

    car.position.x += Math.sin(car.angle) * car.speed;
    car.position.z += Math.cos(car.angle) * car.speed;
    car.rotation.y = car.angle;

    // Границы карты
    car.position.x = Math.max(-190, Math.min(190, car.position.x));
    car.position.z = Math.max(-190, Math.min(190, car.position.z));
};

function initGame() {
    document.getElementById('ui').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    document.getElementById('controls-hint').style.display = 'block';

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c10);
    scene.fog = new THREE.FogExp2(0x0b0c10, 0.004);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(100, 180, 100);
    scene.add(dirLight);

    // Строим карту из map.js
    buildDetailedMap(scene);

    // Загружаем машины (вашу модель)
    createCarModel((loadedCar) => {
        myCar = loadedCar;
        myCar.position.set(isHost ? -60 : 60, 0, 60);
        scene.add(myCar);
    });

    createCarModel((loadedCar) => {
        enemyCar = loadedCar;
        enemyCar.position.set(isHost ? 60 : -60, 0, 60);
        scene.add(enemyCar);
    });

    myRole = isHost ? 'hider' : 'seeker';
    updateRoleUI();

    window.addEventListener('keydown', (e) => handleKey(e, true));
    window.addEventListener('keyup', (e) => handleKey(e, false));

    animate();
}

// Загрузка .glb модели машины из папки models/
function createCarModel(callback) {
    const carGroup = new THREE.Group();
    const loader = new THREE.GLTFLoader();
    
    loader.load(
        'models/car.glb',
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(1.2, 1.2, 1.2); // Подстройте масштаб под свою модель при необходимости
            model.position.y = 0.2;
            carGroup.add(model);
            callback(carGroup);
        },
        undefined,
        (error) => {
            console.warn('Файл models/car.glb не найден. Используется временный кузов.');
            const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x00ffc4, metalness: 0.8 });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.6;
            carGroup.add(body);
            callback(carGroup);
        }
    );
}

function handleKey(e, isDown) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ц' || e.key === 'Ц') keys.w = isDown;
    if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') keys.s = isDown;
    if (e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') keys.a = isDown;
    if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') keys.d = isDown;
    if (e.code === 'Space') keys.space = isDown;
}

function createRoom() {
    isHost = true;
    peer = new Peer();
    peer.on('open', (id) => {
        document.getElementById('menu-main').style.display = 'none';
        document.getElementById('menu-waiting').style.display = 'block';
        document.getElementById('my-room-code').innerText = id;
    });
    peer.on('connection', (connection) => {
        conn = connection;
        setupConnection();
        initGame();
    });
}

function joinRoom() {
    isHost = false;
    const code = document.getElementById('room-input').value.trim();
    if (!code) return alert('Введите код комнаты!');
    peer = new Peer();
    peer.on('open', () => {
        conn = peer.connect(code);
        setupConnection();
        initGame();
    });
}

function setupConnection() {
    conn.on('data', (data) => {
        if (data.type === 'sync' && enemyCar) {
            enemyCar.position.x = data.x;
            enemyCar.position.z = data.z;
            enemyCar.rotation.y = data.rot;
            if (data.tagger !== undefined) {
                myRole = data.tagger ? (isHost ? 'hider' : 'seeker') : (isHost ? 'seeker' : 'hider');
                updateRoleUI();
            }
        }
    });
}

function updateRoleUI() {
    const roleEl = document.getElementById('role-text');
    if (myRole === 'seeker') {
        roleEl.innerText = 'ВОДА (Ищет!)';
        roleEl.style.color = '#ff4757';
    } else {
        roleEl.innerText = 'УБЕГАЕТ (Прячься!)';
        roleEl.style.color = '#2ed573';
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (myCar) {
        physics(myCar);

        // Плавное следование камеры за машинкой
        const targetX = myCar.position.x - Math.sin(myCar.angle) * 15;
        const targetZ = myCar.position.z - Math.cos(myCar.angle) * 15;
        camera.position.x += (targetX - camera.position.x) * 0.1;
        camera.position.y = 9;
        camera.position.z += (targetZ - camera.position.z) * 0.1;
        camera.lookAt(myCar.position.x, myCar.position.y + 1, myCar.position.z);

        // Проверка поимки
        if (conn && conn.open && enemyCar) {
            const dist = myCar.position.distanceTo(enemyCar.position);
            if (dist < 3.5 && myRole === 'seeker') {
                myRole = 'hider';
                updateRoleUI();
                alert('Поймал! Роли поменялись.');
            }

            conn.send({
                type: 'sync',
                x: myCar.position.x,
                z: myCar.position.z,
                rot: myCar.rotation.y,
                tagger: myRole === 'seeker'
            });
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});
