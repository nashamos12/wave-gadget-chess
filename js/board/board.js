var Board = function() {
    EventEmitter.mixin(this);
    this._field = null;
    this._pieces = null;
    this._createField();
};

Board.SIZE = 8;
Board.CELL_SIZE = 50;

Board.getCopy = function(board) {
    var copy = new Board();
    var pieces = board.getPieces();
    for (var i in pieces) {
        var info = pieces[i];
        copy.placePiece(info.row, info.col, info.piece);
    }
    return copy;
};

Board.prototype._createField = function() {
    this._field = [];
    for (var i = 0; i < Board.SIZE; i += 1) {
        var row = [];
        for (var j = 0; j < Board.SIZE; j += 1) {
            row.push(null);
        }
        this._field.push(row);
    }
    this._pieces = {};
};

Board.prototype.placePiece = function(row, col, piece) {
    this._field[row][col] = piece;
    var id = piece.getId();
    this._pieces[id] = {row: row, col: col, piece: piece};
    this.emit('place', function() {
        return [row, col, piece];
    });
};

Board.prototype.movePiece = function(piece, row, col) {
    var id = piece.getId();
    var info = this._pieces[id];
    this._field[row][col] = piece;
    this._field[info.row][info.col] = null;
    this.emit('remove', function() {
        return [info.row, info.col];
    });
    info.row = row;
    info.col = col;
    this.emit('place', function() {
        return [row, col, piece];
    });
    for (var i in Piece.COLORS) {
        var color = Piece.COLORS[i];
        this.emit('check', $.proxy(function() {
            return this.isCheck(color) ? [color] : null;
        }, this));
        this.emit('checkmate', $.proxy(function() {
            return this.isCheckmate(color) ? [color] : null;
        }, this));
    }
};

Board.prototype.removePiece = function(piece) {
    var id = piece.getId();
    var info = this._pieces[id];
    this._field[info.row][info.col] = null;
    delete this._pieces[id];
    this.emit('remove', function() {
        return [info.row, info.col];
    });
};

Board.prototype.getPieces = function() {
    return this._pieces;
};

Board.prototype.getPiecesByColor = function(color) {
    var pieces = {};
    for (var i in this._pieces) {
        var info = this._pieces[i];
        var piece = info.piece;
        if (piece.getColor() == color) {
            var id = piece.getId();
            pieces[id] = info;
        }
    }
    return pieces;
};

Board.prototype.getPieceByCoords = function(row, col) {
    return this._field[row][col];
};

Board.prototype.getPieceByColorAndType = function(color, type) {
    var pieces = this.getPiecesByColor(color);
    for (var i in pieces) {
        var piece = pieces[i].piece;
        if (piece.getType() == type) {
            return piece;
        }
    }
    return null;
};

Board.prototype.getPieceCoords = function(piece) {
    var id = piece.getId();
    var info = this._pieces[id];
    return {row: info.row, col: info.col};
};

Board.prototype.getField = function() {
    return this._field;
};

Board.prototype.isCheck = function(color) {
    var inverted = Piece.getInvertedColor(color);
    var pieces = this.getPiecesByColor(inverted);
    for (var i in pieces) {
        var piece = pieces[i].piece;
        var search = new MoveSearch(this, piece, true);
        var moves = search.get();
        for (var j in moves) {
            if (moves[j].check) {
                return true;
            }
        }
    }
    return false;
};

Board.prototype._hasMoves = function(color) {
    var pieces = this.getPiecesByColor(color);
    for (var i in pieces) {
        var piece = pieces[i].piece;
        var search = new MoveSearch(this, piece);
        var moves = search.get();
        if (moves.length) {
            return true;
        }
    }
    return false;
};

Board.prototype.isCheckmate = function(color) {
    return this.isCheck(color) && !this._hasMoves(color);
};

Board.prototype.isStalemate = function(color) {
    return !this.isCheck(color) && !this._hasMoves(color);
};