function buildDetailedMap(scene) {
    // 1. Остров (земля)
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x243e33, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    scene.add(ground);

    // 2. Центральное озеро
    const lakeGeo = new THREE.CircleGeometry(45, 32);
    const lakeMat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, roughness: 0.1 });
    const lake = new THREE.Mesh(lakeGeo, lakeMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(20, 0.05, 0);
    scene.add(lake);

    // 3. Зона Аэропорта (Справа)
    const runwayGeo = new THREE.BoxGeometry(40, 0.2, 240);
    const runwayMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(110, 0.1, 0);
    scene.add(runway);

    // Ангары аэропорта (укромные места)
    createBlock(scene, 140, 5, -70, 25, 10, 45, 0x555566);
    createBlock(scene, 140, 5, 70, 25, 10, 45, 0x555566);

    // 4. Зона Доков (Слева внизу) — лабиринты из контейнеров для пряток
    for (let x = -150; x <= -95; x += 18) {
        for (let z = 90; z <= 150; z += 14) {
            const color = Math.random() > 0.5 ? 0xcc3333 : 0x3333cc;
            createBlock(scene, x, 3, z, 12, 6, 10, color);
        }
    }
    // Портовые краны
    createBlock(scene, -160, 16, 130, 6, 32, 6, 0xffaa00);

    // 5. Городской квартал (Нижний центр)
    for (let x = -70; x <= 10; x += 30) {
        for (let z = 60; z <= 130; z += 30) {
            createBlock(scene, x, 12, z, 20, 24, 20, 0x42425c);
        }
    }

    // 6. Горные дороги и серпантин (Верхняя часть)
    for (let i = -130; i <= 130; i += 45) {
        createBlock(scene, i, 8, -140, 35, 16, 25, 0x4a4a4a);
        createBlock(scene, i + 20, 15, -95, 30, 26, 25, 0x3a3a3a);
    }

    // 7. Многоуровневые эстакады и мосты (над картой)
    createBridge(scene, -30, 0, 16, 300, 7); // Магистраль север-юг
    createBridge(scene, 0, -35, 220, 16, 11); // Магистраль запад-восток
    createBridge(scene, 65, 30, 130, 16, 13); // Съезд к аэропорту
}

function createBlock(scene, x, y, z, w, h, d, color) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    scene.add(mesh);
}

function createBridge(scene, x, z, width, length, height) {
    // Опорные столбы моста
    for (let i = -length / 2 + 20; i <= length / 2 - 20; i += 45) {
        if (width > length) {
            createBlock(scene, x + i, height/2, z - width/2 + 2, 4, height, 4, 0x555555);
            createBlock(scene, x + i, height/2, z + width/2 - 2, 4, height, 4, 0x555555);
        } else {
            createBlock(scene, x - width/2 + 2, height/2, z + i, 4, height, 4, 0x555555);
            createBlock(scene, x + width/2 - 2, height/2, z + i, 4, height, 4, 0x555555);
        }
    }
    // Полотно эстакады
    const geo = width > length ? new THREE.BoxGeometry(width, 1.5, length) : new THREE.BoxGeometry(length, 1.5, width);
    const mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    const bridge = new THREE.Mesh(geo, mat);
    bridge.position.set(x, height, z);
    scene.add(bridge);
}
