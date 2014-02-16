

/*
 * My rubiks cube implementation.   
 *
 * Methods: 
 *  - rotateFace:
 *    Accepts a 1 to 2 character string. For example: "R" or "Li"
 *     -The first char represents the Side of the cube to turn (U,D,R,L,F,B) 
 *     -The second optional character (i) indicates whether to turn the face counter-clockwise.  
 * 
 * Options:
 *  - this.specificCubes:
 *      this.specificCubes is a whitelist array of cubelets that, if specified, will
 *      be initialized as non-blank while all other cubes will be blank.
 *      The array of cubelets should be of the form: 
 *          ["0,1,2","1,1,0","2,2,2"]
 *      The comma-separated positions refer to "x-position, y-position, z-position" respectively.
 *
 *  - this.emphasize:
 *      A boolean that IF TRUE will turn the non-rotating cubelets blank during a rotation
 *      which effectively emphasizes the moving parts of the cube, aiding in visualizion.
 *
 */
function Rubik(){

    // Stuff for threejs
    this.camera = null,
    this.scene = null,
    this.pieces = [],
    this.slices = {},
    this.renderer = null,

    // html:
    this.parentElement = null,

    // Stuff to control rotations:
    this.pivot = undefined,
    this.currentRotation = undefined,
    this.rotationUpdatesMade = 0,
    this.updatesPerRotation = 30,
    this.totalRotationDistance = 0,
    this.rotationsQue = [],
    this.paused = false,

    // Options:
    this.specificCubes = [],  
    this.emphasize = true,

    // Methods: 
    this.init = function( parentElement ){
        
        this.parentElement = parentElement;

        // scene:
        this.scene = new THREE.Scene(); 
        
        // camera:
        this.createCamera();

        // renderer:
        this.createRenderer();

        // create pieces:
        this.createCubePieces();

        // populate slices:
        this.indexSlices();
    },
    this.render = function(){
        this.renderer.render(this.scene, this.camera); 
    },
    this.animate = function animate(){
        this.update();
        this.render();
        requestAnimationFrame( this.animate.bind(this) );
    },
    this.update = function(){
        var that = this;
        // Rotate it..
        if( typeof this.currentRotation !== 'undefined' ){
            if (this.paused == false){
                this.rotateSlice( 
                    this.currentRotation['slicename'], 
                    this.currentRotation['direction']
                );
            }
        } else {
            // Or shift the que..
            if ( this.rotationsQue.length > 0 ) {
                this.currentRotation = this.rotationsQue.shift();
                this.paused = true;
                // Small pause between rotations:
                setTimeout( function(){
                    that.paused = false;
                }, 40);
            }
            // Or nothing.
        }
    },
    this.rotate = function( r ){
        // Public. If currently rotating: Que it.
        if ( typeof this.currentRotation !== 'undefined' ){
            this.rotationsQue.push( r );
        } else {
            this.currentRotation = r;
        }
    },
    this.rotateFace = function( move ){
        // Public method to be called by html buttons with the appropriate
        // classes and attributes.
        var face = move.charAt(0);
        var inverse = ( move.length > 1 ) ? true : false;
        var slice, dir;
        if ( face === 'R') {
            slice = 'x2';
        } else if ( face === 'L' ){
            slice = 'x0';
        } else if ( face === 'U' ){
            slice = 'y2';
        } else if ( face === 'D' ){
            slice = 'y0';
        } else if ( face === 'F' ){
            slice = 'z2';
        } else if ( face === 'B' ){
            slice = 'z0';
        }
        dir = (inverse) ? 'up' : 'down';
        console.log("rotate: " + slice +" direction: " + dir);
        this.rotate( { slicename: slice, direction: dir } );
    },
    this.createRenderer = function( ){
        if( Detector.webgl )
            this.renderer = new THREE.WebGLRenderer( { antialias:true, alpha:true } );
        else
            this.renderer = new THREE.CanvasRenderer();
        this.renderer.setSize( 360, 360 ); 
        if (this.backgroundColor) {
            this.renderer.setClearColor( 0xffffff, 1);
        }
        // Add renderer to html:
        $( this.parentElement ).append( this.renderer.domElement );
    },
    this.createCubePieces = function(){
        // Create rubik cube pieces:
        for( var y=0; y< 3; y++ ) {
            for( var x=0; x< 3; x++ ) {
                for( var z=0; z< 3; z++ ) {
                    var geo = new THREE.CubeGeometry(1,1,1);
                    // Get colored or blank cube image:
                    var isBlank = false;
                    if ( this.specificCubes.length > 0 ) {
                        var thisCube = x.toString()+","+y.toString()+","+z.toString(); 
                        if ( this.specificCubes.indexOf(thisCube) === -1 ) {
                            isBlank = true;
                        } 
                    }
                    var materials = this.getCubeMaterials(isBlank);
                    var movingMaterials = new THREE.MeshFaceMaterial(materials);
                    var cubePiece = new THREE.Mesh( geo, movingMaterials );
                    // Set cubes position in space:
                    cubePiece.position.set(x-1,y-1,z-1);
                    // Add to cubePieces list:
                    this.pieces.push(cubePiece);
                    // Add pieces to scene:
                    this.scene.add(cubePiece);
                }
            }
        }
    },
    this.createCamera = function(){
        // camera:
        var camera = new THREE.PerspectiveCamera( 
            50, 
            700/700,
            0.1, 
            1000 
        ); 
        camera.position.z = 4.5;
        camera.position.x = 2.7;
        camera.position.y = 3.4;
        camera.lookAt(this.scene.position);
        this.camera = camera;
    },
    this.getCubeMaterials = function( isBlank ){
        var materialArray = [];
        if (isBlank){
            var images = []; // meh, this could be better
            for (var i=0; i< 6; i++){
                images.push('/images/cube-blank.png');
            }
        } else {
            var images = [
                '/images/cube-front.png',
                '/images/cube-back.png',
                '/images/cube-top.png',
                '/images/cube-bottom.png',
                '/images/cube-right.png',
                '/images/cube-left.png',
            ];
        }
        _.each(images, function(image){
            materialArray.push(new THREE.MeshBasicMaterial( { 
                map: THREE.ImageUtils.loadTexture( image ) ,
                color: 0xffffff
            }));
        });      
        return materialArray; 
    },
    this.getSlicePieces = function(sliceName){
        return this.slices[sliceName];
    },
    this.getNonRotatingPieces = function(sliceName){
        var that = this;
        var possibleIndexes = [0,1,2];
        var sliceAxis = sliceName.charAt(0);
        var axisIndex = sliceName.charAt(1);
        var nonRotating = [];
        possibleIndexes.splice(axisIndex, 1);
        _.each(possibleIndexes, function( idx ) {
            var pieces = that.getSlicePieces( sliceAxis + idx.toString() );
            _.each(pieces, function(piece){
                nonRotating.push(piece);
            });
        });
        return nonRotating;
    },
    this.createPivot = function(slice){
        var pivot = new THREE.Object3D();
        _.each(slice, function(piece){
            pivot.add(piece);
        });
        return pivot;    
    },
    this.logSlicePositions = function(sliceName){
        var slicePieces = this.getSlicePieces(sliceName);
        var positionString = "";
        var first = true;
        _.each(slicePieces, function(piece){
            var slicePos = piece.position.x.toString()+','
                           + piece.position.y.toString()+','
                           + piece.position.z.toString();
            if (!first) positionString += "|";
            positionString += slicePos;
            first = false;
        });
        console.log("pos string: " + positionString);
    },
    this.correctCubePositions = function(){
        _.each(this.pieces, function(piece){
            piece.position.x = Math.round(piece.position.x);
            piece.position.y = Math.round(piece.position.y);
            piece.position.z = Math.round(piece.position.z);
        });
    },
    this.blankMaterials = this.getCubeMaterials(true),
    this.toggleNonRotatingSlices = function(sliceName, displayCubes){
        // This method assumes that the cube starts out non-blank:
        // Fades (or unfades) non rotating pieces
        //if ( !displayCubes ){
        //    var blankMaterials = this.getCubeMaterials(true);
        //} 
        var that = this;
        var nonRotatingPieces = this.getNonRotatingPieces(sliceName);
        _.each(nonRotatingPieces, function(piece) {
            if ( displayCubes ) {
                piece.material.materials = piece.savedMaterials;
            } else {
                piece.savedMaterials = piece.material.materials.slice();
                piece.material.materials = that.blankMaterials;
            }
        });
    },
    this.rotateSlice = function(sliceName, direction) {
        // Private-ish method
        var coordinate = sliceName.charAt(0);
        var that = this;
        // Add pivot if we are beginning a rotation:
        if ( typeof this.pivot === 'undefined' ){
            var slice = this.getSlicePieces(sliceName);
            // make the non-rotating pieces transparent
            if (this.emphasize) { this.toggleNonRotatingSlices(sliceName, false); }
            var pivot = this.createPivot(slice);
            pivot.updateMatrixWorld();
            this.pivot = pivot;
            this.slice = slice;
            this.scene.add(this.pivot);
            // attach
            _.each(slice, function(piece){
                THREE.SceneUtils.attach( piece, that.scene, that.pivot );
            });
        }
        // rotate it a litle bit:
        var pivotDistance = Math.PI / 2 / this.updatesPerRotation;
        if ( this.currentRotation['direction'] === 'up' ) {
            this.pivot.rotation[coordinate] += pivotDistance;
        } else {
            this.pivot.rotation[coordinate] -= pivotDistance;
        }
        // update total rotation distance:
        this.totalRotationDistance += pivotDistance;
        // update positions
        this.pivot.updateMatrixWorld(); 
        // increment:
        this.rotationUpdatesMade +=1;
        // Done rotating?
        if (this.rotationUpdatesMade === this.updatesPerRotation){
            
            if (this.emphasize){ this.toggleNonRotatingSlices(sliceName, true); }

            this.pivot.updateMatrixWorld(); 
            // turn off rotation flag:
            this.currentRotation = undefined;
            // reset
            this.rotationUpdatesMade = 0;
            this.totalRotationDistance = 0;
            // remove
            this.scene.remove(pivot);
            // detach
            _.each(this.slice, function(piece){
                piece.updateMatrixWorld();
                THREE.SceneUtils.detach( piece, that.pivot, that.scene );
            });
            this.slice = undefined;
            this.indexSlices();
            this.pivot = undefined;
        }
    },
    this.indexSlices = function(){
        // This method assigns cube pieces to slices (sides) within the cube.
        var cubeSlices = {};

        // So this is kind of important..
        this.correctCubePositions();

        _.each(this.pieces, function(piece){
            var x = parseInt(piece.position.x)+1;
            var y = parseInt(piece.position.y)+1;
            var z = parseInt(piece.position.z)+1;
            var k = 'y'+String(y);
            if ( typeof cubeSlices[k] === 'undefined' ){
                cubeSlices[k] = []; 
            }
            if (cubeSlices[k].indexOf(piece) === -1) {
                cubeSlices[k].push(piece);
            }
            var k = 'x'+String(x);
            if ( typeof cubeSlices[k] === 'undefined' ){
                cubeSlices[k] = []; 
            }
            if (cubeSlices[k].indexOf(piece) === -1) {
                cubeSlices[k].push(piece);
            }
            var k = 'z'+String(z);
            if ( typeof cubeSlices[k] === 'undefined' ){
                cubeSlices[k] = []; 
            }
            if (cubeSlices[k].indexOf(piece) === -1) {
                cubeSlices[k].push(piece);
            }
        });
        this.slices = cubeSlices;
    },
    this.nearlyEqual = function(a, b, d) {
        d = d || 0.001;
        return Math.abs(a - b) <= d;
    }    
}; // end rubik
