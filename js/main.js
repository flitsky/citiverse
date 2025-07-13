document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('container');
    const sceneManager = new SceneManager(container);
    
    sceneManager.addScene('earth', EarthScene);
    sceneManager.addScene('map', MapScene);
    sceneManager.addScene('factory', FactoryScene);
    
    sceneManager.switchScene('earth');
    
    console.log('Citiverse initialized!');
    console.log('Use the buttons above to switch between scenes:');
    console.log('- Earth 3D: Rotating Earth with atmosphere');
    console.log('- Seoul Map: Top-down view of Gangnam-gu district');
    console.log('- Metaverse Factory: Industrial scene with animated workers and machines');
});