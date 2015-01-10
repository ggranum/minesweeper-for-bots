(function () {
  //noinspection BadExpressionStatementJS
  'use strict';
  var GameCell = function (config) {
    Object.assign(this, config);

  };
  GameCell.prototype = {
    game: undefined,
    isMined: false,
    isCleared: false,
    position: -1,
    row: -1,
    col: -1,
    nearCount: 0,
    inspect: function () {
      if (this.isMined) {
        this.game.boom(this);
        this.isCleared = true;
      } else {
        this.game.phew(this);
        this.isCleared = true;
      }
    }
  };

  var Ms4BotsGame = function (config) {
    this.grid = [];
    this.minesByPosition = [];
    this.gridSize = config.gridSize || this.gridSize;
    this.mineCount = config.mineCount || this.mineCount;
    this.initGrid(this.gridSize, this.mineCount);

  };
  Ms4BotsGame.prototype = {
    adjacencyMatrix: [
      [-1, 1],
      [-1, 0],
      [-1, -1],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, 0],
      [1, -1]],
    gameOver: false,
    score: 0, // use a closure to make cheating slightly harder? Naw.
    bombHit: false, // easier to train AI at first if hitting bomb doesn't instantly end game. Maybe?
    gridSize: 10, // 10x10.
    mineCount: 10,

    // [gridSize^2 by 1] array
    grid: undefined,

    // [mineCount by 1 ] array.
    minesByPosition: undefined,

    initGrid: function (dimension, mineCount) {
      var cellCount = dimension * dimension;
      if (mineCount > (cellCount - 5)) {
        throw new Error("Way too many mines!");
      }

      for (var i = 0; i < mineCount; i++) {
        var p;
        do {
          p = Math.floor(Math.random() * cellCount);
        } while (p !== dimension && this.minesByPosition[p] !== undefined); // if random produces exactly cell count we get an array that is one too large.
        var xy = this.to2dIndex(p);
        this.grid[p] = new GameCell({game: this, isMined: true, position: p, row: xy[0], col: xy[1]});
      }

      for (i = 0; i < cellCount; i++) {
        if (!this.grid[i]) {
          var rowCol = this.to2dIndex(i);
          this.grid[i] = new GameCell({game: this, position: i, row: rowCol[0], col: rowCol[1]});
        }
      }

      var mined = this.grid.filter(this.hasMineFilter);
      mined.forEach(function (minedCell) {
        var nearBomb = this.getAdjacentCells(minedCell, function (cell) {
          cell.nearCount++;
          return true;
        });
      }, this);
    },

    /**
     * Above average count of cyclic dependencies, so a little clean up...
     */
    gozer: function(){
      this.grid.forEach(function(cell){
        cell.game = null;
      });
    },

    hasMineFilter: function (cell) {
      return cell.isMined;
    },

    notClearedFilter: function (cell) {
      return !cell.isCleared;
    },

    toLinearIndex: function (row, col) {
      return row * this.gridSize + col;
    },

    to2dIndex: function (linearIndex) {
      return [Math.floor(linearIndex / this.gridSize), linearIndex % this.gridSize];
    },

    getAdjacentCells: function (cell, filter) {
      var near = [];
      for (var i = 0, L = this.adjacencyMatrix.length; i < L; i++) {
        var row = cell.row + this.adjacencyMatrix[i][0];
        var col = cell.col + this.adjacencyMatrix[i][1];
        if (this.isCellInGrid(col, row)) {
          var adjCell = this.grid[this.toLinearIndex(row, col)];
          if (!filter || filter(adjCell)) {
            near.push(adjCell);
          }
        }
      }
      return near;
    },

    isCellInGrid: function (col, row) {
      return col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize;
    },

    boom: function (cell) {
      this.bombHit = true;
      this.score -= cell.nearCount * 10;
    },

    phew: function (cell) {
      this.score += cell.nearCount;
      this.clearAdjacent([cell]);
      this.checkForWin();
    },

    checkForWin: function () {
      var gameOver = this.grid.every(function (cell) {
        return cell.isCleared || cell.isMined;
      });
      if(gameOver){
        this.score += this.gridSize*this.gridSize + 100*this.mineCount/this.gridSize;
      }
      this.gameOver = gameOver;
    },

    clearAdjacent: function (cells) {
      cells.forEach(function (cell) {
        if (!cell.isMined) {
          cell.isCleared = true;
          if (cell.nearCount === 0) {
            this.clearAdjacent(this.getAdjacentCells(cell, this.notClearedFilter));
          }
        }
      }, this);
    }
  };

  window.Ms4BotsGame = Ms4BotsGame;

}());