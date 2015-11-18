// a couple of example cube maps
var path = "textures/";
////var path = "../images/sky/";
var imageNames = [
    path + "SunSetLeft2048.png",
    path + "SunSetRight2048.png",
    path + "SunSetUp2048.png",
    path + "SunSetDown2048.png",
    path + "SunSetFront2048.png",
    path + "SunSetBack2048.png"
];

var axis = 'z';
var paused = false;
var camera;

var rockDir = false;
var shipDir = false;
var rocketDrop = true;
var rocketFire = false;

var planeDummy;
var rocketDummy;

//translate keypress events to strings
//from http://javascript.info/tutorial/keyboard-events
function getChar(event) {
    if (event.which == null) {
        return String.fromCharCode(event.keyCode) // IE
    } else if (event.which!=0 && event.charCode!=0) {
        return String.fromCharCode(event.which)   // the rest
    } else {
        return null // special key
    }
}

function cameraControl(c, ch)
{
    var distance = c.position.length();
    var q, q2;

    switch (ch)
    {
        // camera controls
        case 'w':
            c.translateZ(-0.7);
            return true;
        case 'a':
            c.translateX(-0.7);
            return true;
        case 's':
            c.translateZ(0.7);
            return true;
        case 'd':
            c.translateX(0.7);
            return true;
        case 'r':
            c.translateY(0.1);
            return true;
        case 'f':
            c.translateY(-0.1);
            return true;
        case 'j':
            // need to do extrinsic rotation about world y axis, so multiply camera's quaternion
            // on left
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            return true;
        case 'l':
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            return true;
        case 'i':
            // intrinsic rotation about camera's x-axis
            c.rotateX(5 * Math.PI / 180);
            return true;
        case 'k':
            c.rotateX(-5 * Math.PI / 180);
            return true;
        case 'O':
            c.lookAt(new THREE.Vector3(0, 0, 0));
            return true;
        case 'S':
            c.fov = Math.min(80, c.fov + 5);
            c.updateProjectionMatrix();
            return true;
        case 'W':
            c.fov = Math.max(5, c.fov  - 5);
            c.updateProjectionMatrix();
            return true;

        // alternates for arrow keys
        case 'J':
            //this.orbitLeft(5, distance)
            c.translateZ(-distance);
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            c.translateZ(distance)
            return true;
        case 'L':
            //this.orbitRight(5, distance)
            c.translateZ(-distance);
            q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0),  -5 * Math.PI / 180);
            q2 = new THREE.Quaternion().copy(c.quaternion);
            c.quaternion.copy(q).multiply(q2);
            c.translateZ(distance)
            return true;
        case 'I':
            //this.orbitUp(5, distance)
            c.translateZ(-distance);
            c.rotateX(-5 * Math.PI / 180);
            c.translateZ(distance)
            return true;
        case 'K':
            //this.orbitDown(5, distance)
            c.translateZ(-distance);
            c.rotateX(5 * Math.PI / 180);
            c.translateZ(distance)
            return true;
    }
    return false;
}

function handleKeyPress(event)
{
    var ch = getChar(event);
    if (cameraControl(camera, ch)) return;

    switch(ch)
    {
        case ' ':
            paused = !paused;
            break;
        case 'x':
            axis = 'x';
            break;
        case 'y':
            axis = 'y';
            break;
        case 'z':
            axis = 'z';
            break;
        default:
            return;
    }
}

function start()
{


    window.onkeypress = handleKeyPress;

    var scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 30, 1.5, 0.1, 1000 );
    camera.position.x = 80;
    camera.position.y = 10;
    camera.position.z = 35;
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    var ourCanvas = document.getElementById('theCanvas');
    var renderer = new THREE.WebGLRenderer({canvas: ourCanvas});

    // Loads the six images
    // Note optional second parameter, this allows the texture to be used for refraction
    // (and the texture still works for the skybox).
    var ourCubeMap = THREE.ImageUtils.loadTextureCube(imageNames);
    //var ourCubeMap = THREE.ImageUtils.loadTextureCube(imageNames, THREE.CubeRefractionMapping);

    // Use a built-in Three.js shader for cube maps
    var cubeMapShader = THREE.ShaderLib["cube"];
    cubeMapShader.uniforms[ "tCube" ].value = ourCubeMap;
    var material = new THREE.ShaderMaterial( {
        fragmentShader: cubeMapShader.fragmentShader,
        vertexShader: cubeMapShader.vertexShader,
        uniforms: cubeMapShader.uniforms,
        side: THREE.BackSide  // we'll only see the inside of the cube
    } );

    // Make a big ole cube for the skybox
    var geometry = new THREE.BoxGeometry( 1000, 1000, 1000 );

    // Create a mesh for the skybox using the cube shader as the material
    var cube = new THREE.Mesh( geometry, material );

    // Add it to the scene
    scene.add( cube );

    geometry = new THREE.CylinderGeometry(3,3,35, 35);
   // material = new THREE.MeshLambertMaterial( {color: 0x5cd65c, envMap : ourCubeMap, refractionRatio : 0.5, reflectivity:.75});
    material = new THREE.MeshPhongMaterial( {color: 0x5cd65c});
    var wingmaterial = new THREE.MeshPhongMaterial( {color: 0x5cd65c});

    planeDummy = new THREE.Object3D();
    var planeHull = new THREE.Mesh(geometry, material);
    planeHull.rotation.z += 90 * Math.PI/180;
    planeDummy.add(planeHull);


    geometry = new THREE.CylinderGeometry(3, 0, 10, 35);
    var nose = new THREE.Mesh(geometry, material);
    nose.rotation.z += 90 * Math.PI/180;
    nose.position.set(22.5,0,0);
    planeDummy.add(nose);

    geometry = new THREE.Geometry();
    var tailv1 = new THREE.Vector3(0,0,0);   // Vector3 used to specify position
    var tailv2 = new THREE.Vector3(13,0,0);
    var tailv3 = new THREE.Vector3(0,5,0);   // 2d = all vertices in the same plane.. z = 0

    // Push vertices represented by position vectors
    geometry.vertices.push(tailv1);
    geometry.vertices.push(tailv2);
    geometry.vertices.push(tailv3);

    geometry.faces.push(new THREE.Face3(0, 2, 1));
    geometry.faces.push(new THREE.Face3(1, 2, 0));

    // Create a material and combine with geometry to create our mesh
    var tail = new THREE.Mesh(geometry, wingmaterial);
    tail.position.set(-18,3,0)

    planeDummy.add(tail);

    var wingShape = new THREE.Shape();
    wingShape.moveTo( -20,0);
    wingShape.lineTo(20,0);
    wingShape.lineTo(0,30);
    wingShape.lineTo(-20,0);
    var extrudeSettings = { amount: 1, bevelEnabled: false, steps: 2 };
    geometry = new THREE.ExtrudeGeometry( wingShape, extrudeSettings );

    var mesh = new THREE.Mesh( geometry, new THREE.MeshPhongMaterial( { color: 0x5cd65c } ) );

    mesh.position.set( -10,-1,0 );
    mesh.rotation.z -= 90 * Math.PI/180;
    mesh.rotation.x -= 90 * Math.PI/180;
    //mesh.scale.set( s, s, s );
    planeDummy.add( mesh );



    geometry = new THREE.SphereGeometry(0.5);
    var greenTipMat = new THREE.MeshBasicMaterial( {color: 0x00ff00});
    var greenWingTip = new THREE.Mesh(geometry, greenTipMat);
    greenWingTip.position.set(-10,0,20);
    planeDummy.add(greenWingTip);

    var greenlight = new THREE.PointLight(0x00ff00, 1.0);
    greenlight.position.set(-9,1.5,18);
    planeDummy.add(greenlight);

    geometry = new THREE.SphereGeometry(0.5);
    var redTipMat = new THREE.MeshBasicMaterial( {color: 0xff0000});
    var redWingTip = new THREE.Mesh(geometry, redTipMat);
    redWingTip.position.set(-10,0,-20);
    planeDummy.add(redWingTip);

    var redLight = new THREE.PointLight(0xff0000, 1.0,0);
    redLight.position.set(-9,1.5,-18);
    planeDummy.add(redLight);
    scene.add(planeDummy);

    rocketDummy = new THREE.Object3D();
    geometry = new THREE.BoxGeometry(1,1,1);
    material = new THREE.MeshPhongMaterial({color : 0x404040});
    var rocket = new THREE.Mesh(geometry, material);
    rocket.scale.set(7,2,2);
    rocket.position.set(-100, 11, -10);
    rocketDummy.add(rocket);

    var rocketFlame = new THREE.PointLight(0xFFA500, 1.0, 50);
    rocketFlame.position.set(-95,11, -10);
    rocketDummy.add(rocketFlame);

    scene.add(rocketDummy);

    var texture = new THREE.Texture();

    var manager = new THREE.LoadingManager();

    var loader = new THREE.ImageLoader( manager );
    loader.load( 'xbox360/space_frigate_6_color.png', function ( image ) {

        texture.image = image;
        texture.needsUpdate = true;

    } );


    loader = new THREE.OBJLoader(manager);
    var ship;
    loader.load( 'xbox360/space_frigate_6.obj', function ( object ) {

        object.traverse( function ( child ) {

            if ( child instanceof THREE.Mesh ) {

                child.material.map = texture;

            }

        } );

        object.position.set(-100, 16, -10);
        object.rotation.y = 180 * Math.PI/180;
        ship = object;
        scene.add( ship );

    });

    var light = new THREE.AmbientLight(0x202020);
    scene.add(light);

    var render = function () {
        requestAnimationFrame( render );
        var increment = 0.5 * Math.PI / 180.0;

        if(ship.position.y > 18){
            shipDir = true;
        }

        if(ship.position.y < 14){
            shipDir = false;
        }

        if(shipDir){
            ship.position.y = ship.position.y -= 0.025;
        } else {
            ship.position.y = ship.position.y += 0.025;
        }
        if(planeDummy.rotation.x > 0.3){
            rockDir = true;
        }

        if(planeDummy.rotation.x < -0.3){
            rockDir = false;
        }


        if(rocketDummy.position.y < -5){
            rocketDrop = false;
            rocketFire = true;
        }

        if(rocketDummy.position.x > 500){
            rocketDrop = true;
            rocketFire = false;
            rocketDummy.position.set(0, 0, 0);
        }

        if(rocketDrop){
            rocketDummy.position.y -= 0.2;
            rocketDummy.position.x += 0.5;
        }

        if(rocketFire){
            rocketDummy.position.x += 1.5;
        }


        if(rockDir){
            planeDummy.applyMatrix(new THREE.Matrix4().makeRotationX(-increment * 0.25));
        } else {
            planeDummy.applyMatrix(new THREE.Matrix4().makeRotationX(increment * 0.25));
        }
        renderer.render(scene, camera);
    };

    render();




}