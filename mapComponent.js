import React, { Component } from "react";

// Creates a Map instance with the following arrays (layers).
// Each array represents a layer of tiles drawn onto the canvas
// 0 means nothing is drawn on
const Map = new MapCreator(5, 10, 64, [
  [ // Grass or road tiles
    2, 2, 2, 1, 2, 1, 1, 1, 2, 2, 1, 2, 1, 2, 1, 2, 2, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 2
  ],
  [ // Obstacles and grass edging roads
    0, 4, 0, 7, 0, 6, 9, 8, 0, 0, 8, 0, 9, 0, 9, 3, 0, 8, 6, 9, 0, 0, 5, 8, 0, 0, 6, 0, 3, 0, 8, 0, 4, 0, 6, 6, 5, 8, 0, 9, 0, 6, 0, 6, 6, 0, 6, 9, 0, 4
  ],
  [ // Houses and grass edging 
    10, 0, 16, 0, 19, 7, 7, 7, 16, 18, 0, 15, 0, 17, 0, 0, 11, 0, 0, 0, 11, 0, 0, 0, 0, 20, 0, 12, 0, 19, 9, 14, 0, 18, 0, 9, 0, 0, 10, 6, 12, 7, 13, 0, 7, 10, 7, 6, 14, 0
  ]
]);


/**
 * MapComponent is our instance of the MapCreator, used to dictate the size of the game board, individual tiles, and to create the layers of the graphical game board.
 * It initializes the canvas layers and draws the game board and sprite onto those canvases.
 */
class MapComponent extends Component {
    constructor(props) {
      super(props);
      this.state = {
        // Here we are setting the game board size in pixels
        width: 640,
        height: 320,
        // These store the current X and Y coordinates of the user's sprite
        userX: props.userX,
        userY: props.userY
      };

      // We used React.createRef() to hold two refs for accessing the DOM
      // One is used to build the world map in 3 layers, while the other creates the character sprite for navigating the game
      this.canvasRef = React.createRef();
      this.canvasRef2 = React.createRef();
    }

    /**
     * Update Map will update the current map by redrawing the 2 canvas refs
     * @params: none
     * returns none
     */
    updateMap() {
      const image = new Image();
      const userCharacter = new Image();
      image.src = tileMap;
      userCharacter.src = sprite;
      const ctx = this.canvasRef.current.getContext("2d");
      const ctx2 = this.canvasRef2.current.getContext("2d");
  
      // This function checks if the source image for both the tileset and sprite have loaded, only drawing the canvas afterwards to prevent errors
      const background = () => {
        return new Promise(resolve => {

          image.onload = () => {
            // Iterates over each of the 3 arrays in the game map array
            for (var i = 0; i < 3; i++) {
              // Iterates over the Map's columns
              for (var c = 0; c < Map.columns; c++) {

                // Iterates over the Map's rows
                for (var r = 0; r < Map.rows; r++) {
                  // For each tile, we grab the associated 64 pixel square on the tilemap artwork, to draw that onto the Canvas element to create the map

                  var tile = Map.getTile(i, c, r);
                  if (tile !== 0) {
                    ctx.drawImage(
                      image, // image
                      (tile - 1) * Map.tile_size, // source x
                      0, // source y
                      Map.tile_size, // source width
                      Map.tile_size, // source height
                      c * Map.tile_size, // target x
                      r * Map.tile_size, // target y
                      Map.tile_size, // target width
                      Map.tile_size // target height
                    );
                  }
                }
              }
            }
          };
          resolve("Done");
        });
      };

      background();

      const { userX, userY } = this.state;

      // This function handles the user's movements of the sprite, adjusting where it is drawn based on which direction it was moved
      userCharacter.onload = () => {
        
        switch (this.props.moveDirection) {
          case "n":
            this.setState(
              {
                ...this.state,
                userY: this.state.userY - 64
              },
              () => draw(this.state.userX, this.state.userY)
            );
            break;

          case "e":
            this.setState(
              {
                ...this.state,
                userX: this.state.userX + 64
              },
              () => draw(this.state.userX, this.state.userY)
            );
            break;

          case "w":
            this.setState(
              {
                ...this.state,
                userX: this.state.userX - 64
              },
              () => draw(this.state.userX, this.state.userY)
            );
            break;

          case "s":
            this.setState(
              {
                ...this.state,
                userY: this.state.userY + 64
              },
              () => draw(this.state.userX, this.state.userY)
            );
            break;

          default:
            console.log(`Can't move that way`);
            draw(userX, userY);
        }
      };

      // This function draws the canvas instances of both the game map and the character sprite
      function draw(x, y) {
        ctx2.clearRect(0, 0, 640, 320);
        ctx2.drawImage(userCharacter, 0, 0, 64, 64, x, y, 64, 64);
      }
    };

    // Watching for if props change, indicating the user has moved
    componentDidUpdate(prevProps) {
      if (prevProps !== this.props) {
        this.updateMap();
      }
    };


    /**
     * Grabs the Canvas DOM node React ref
     * @param: none
     * return the canvas react ref
     */
    getContext = () => this.canvasRef.current.getContext("2d");
  
    componentDidMount() {
      this.initializeGame();
  
      this.updateMap();
    }

    /**
     * Initializes the user's character into the game,
     *@param: none
     */
    initializeGame = () => {
      config
        .axiosWithAuth()
        .get(`/api/adv/init/`)
        .then(({ data: { uuid, name, title, description, players } }) => {
          this.setState(
            {
              uuid,
              name,
              title,
              description,
              players
            },
            () => this.getStartingTile(title)
          );
        })
        .catch(err => {
          console.log(err);
        });
    };

    /**
     * Receives a room title and sets the starting tile of the user
     * @param: room title
     * returns user coordinates
     */
    getStartingTile(title) {
      let splitRoom = title.split("_");
      let roomNumber = Number(splitRoom[1]);
      let row = Math.floor(roomNumber / 10);
      let column = (roomNumber % 10) - 1;
      if (column === -1) {
        column = 9;
        row -= 1;
      }
      let userX = 0 + column * 64;
      let userY = 0 + row * 64;
      this.setState({ userX, userY });
      return [userX, userY];
    };

    render() {
      const { width, height } = this.state;
  
      return (
        <MapWrapper>
          <canvas ref={this.canvasRef} width={width} height={height} />
          <canvas
            ref={this.canvasRef2}
            width={width}
            height={height}
            style={{ position: "absolute", top: "0", left: "1rem" }}
          />
        </MapWrapper>
      );
    }
  }