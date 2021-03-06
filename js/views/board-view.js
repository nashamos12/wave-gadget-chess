var BoardView = function(board, state) {
    EventEmitter.mixin(this);
    this._piece = null;
    this._node = null;
    this._board = board;
    this._state = state;
    this._isRotated = false;
    this._init();
};

BoardView.CELL_SIZE = 40;

BoardView.prototype._createField = function() {
    this._node = $('.board');
    this._node.empty();
    for (var i = 0; i < Board.SIZE; i += 1) {
        var row = $('<div class="row"></div>');
        for (var j = 0; j < Board.SIZE; j += 1) {
            var cell = $('<div class="cell"></div>');
            row.append(cell);
        }
        var coords = this._getCoords(i, 0);
        var number = Board.getRowNumber(coords.row);
        row.append('<div class="number">' + number + '</div>');
        this._node.append(row);
    }
    var row = $('<div></div>');
    for (var i = 0; i < Board.SIZE; i += 1) {
        var coords = this._getCoords(0, i);
        var letter = Board.getColLetter(coords.col);
        row.append('<div class="letter">' + letter + '</div>');
    }
    this._node.append(row);
};

BoardView.prototype._removeChosenMarker = function() {
    this._node.find('.chosen').removeClass('chosen');
    this._piece = null;
};

BoardView.prototype._removeMoveMarkers = function() {
    this._node.find('.move, .attack, .en-passant, .promotion, .long-castling, .short-castling').remove();
};

BoardView.prototype._removeCheckMarker = function() {
    this._node.find('.check').removeClass('check');
};

BoardView.prototype._removeAllMarkers = function() {
    this._removeChosenMarker();
    this._removeMoveMarkers();
    this._removeCheckMarker();
};

BoardView.prototype._getCoords = function(row, col) {
    if (this._isRotated) {
        row = Board.SIZE - row - 1;
        col = Board.SIZE - col - 1;
    }
    return {row: row, col: col};
};

BoardView.prototype._getCell = function(row, col) {
    var coords = this._getCoords(row, col);
    return this._node.find('.row:eq(' + coords.row + ') .cell:eq(' + coords.col + ')');
};

BoardView.prototype._placePiece = function(row, col, piece) {
    var cell = this._getCell(row, col);
    var node = $('<div class="icon piece ' + piece.getType() + ' ' + piece.getColor() + '"></div>');
    cell.append(node);
};

BoardView.prototype._removePiece = function(row, col) {
    var cell = this._getCell(row, col);
    cell.find('.piece').remove();
};

BoardView.prototype._onPlace = function(row, col, piece) {
    this._removeAllMarkers();
    this._placePiece(row, col, piece);
};

BoardView.prototype._onMove = function(fromRow, fromCol, toRow, toCol, piece) {
    this._removeAllMarkers();
    this._removePiece(fromRow, fromCol);
    this._node.find('.last-move').removeClass('last-move');
    var cell = this._getCell(fromRow, fromCol);
    cell.addClass('last-move');
    this._placePiece(toRow, toCol, piece);
    var cell = this._getCell(toRow, toCol);
    cell.addClass('last-move');
};

BoardView.prototype._onRemove = function(row, col) {
    this._removeAllMarkers();
    this._removePiece(row, col);
};

BoardView.prototype._onCheck = function(color) {
    this._removeAllMarkers();
    var piece = this._board.getPieceByColorAndType(color, Piece.TYPES.KING);
    var coords = this._board.getPieceCoords(piece);
    var cell = this._getCell(coords.row, coords.col);
    cell.addClass('check');
};

BoardView.prototype._onCheckmate = function(color) {
    this._removeAllMarkers();
    var piece = this._board.getPieceByColorAndType(color, Piece.TYPES.KING);
    var coords = this._board.getPieceCoords(piece);
    var cell = this._getCell(coords.row, coords.col);
    cell.addClass('checkmate');
};

BoardView.prototype._onStalemate = function(color) {
    this._removeAllMarkers();
    var piece = this._board.getPieceByColorAndType(color, Piece.TYPES.KING);
    var coords = this._board.getPieceCoords(piece);
    var cell = this._getCell(coords.row, coords.col);
    cell.addClass('stalemate');
};

BoardView.prototype._addBoardListeners = function() {
    this._board.on('place', $.proxy(this._onPlace, this));
    this._board.on('move', $.proxy(this._onMove, this));
    this._board.on('remove', $.proxy(this._onRemove, this));
    this._board.on('check', $.proxy(this._onCheck, this));
    this._board.on('checkmate', $.proxy(this._onCheckmate, this));
    this._board.on('stalemate', $.proxy(this._onStalemate, this));
};

BoardView.prototype._rotateBoard = function() {
    this._isRotated = !this._isRotated;
    this._createField();
    var pieces = this._board.getPieces();
    for (var i in pieces) {
        var info = pieces[i];
        this._placePiece(info.row, info.col, info.piece);
    }
};

BoardView.prototype._showAvailableMoves = function(row, col) {
    this._removeMoveMarkers();
    var piece = this._board.getPieceByCoords(row, col);
    var search = new MoveSearch(this._board, piece);
    var moves = search.get();
    for (var i in moves) {
        var move = moves[i];
        var cell = this._getCell(move.row, move.col);
        var type = move.type;
        if (type != 'check') {
            var node = $('<div class="icon ' + type + '"></div>');
            cell.append(node);
        }
    }
};

BoardView.prototype._selectPiece = function(row, col) {
    this._removeChosenMarker();
    var cell = this._getCell(row, col);
    cell.addClass('chosen');
    this._piece = {row: row, col: col};
    this._showAvailableMoves(row, col);
};

BoardView.prototype._deselectPiece = function() {
    this._removeChosenMarker();
    this._removeMoveMarkers();
};

BoardView.prototype._showPromotionDialog = function(element, callback) {
    this._node.find('.promotion-dialog').remove();
    var piece = this._board.getPieceByCoords(this._piece.row, this._piece.col);
    var color = piece.getColor();
    var dialog = $(
        '<div class="promotion-dialog"> \
            <div class="icon piece ' + color + ' ' + Piece.TYPES.KNIGHT + '"></div> \
            <div class="icon piece ' + color + ' ' + Piece.TYPES.ROOK + '"></div> \
            <div class="icon piece ' + color + ' ' + Piece.TYPES.BISHOP + '"></div> \
            <div class="icon piece ' + color + ' ' + Piece.TYPES.QUEEN + '"></div> \
        </div>'
    );
    var offset = element.offset();
    dialog.offset(offset);
    dialog.click(function(event) {
        var element = $(event.target);
        if (element.hasClass('knight')) {
            callback(Piece.TYPES.KNIGHT);
        }
        if (element.hasClass('rook')) {
            callback(Piece.TYPES.ROOK);
        }
        if (element.hasClass('bishop')) {
            callback(Piece.TYPES.BISHOP);
        }
        if (element.hasClass('queen')) {
            callback(Piece.TYPES.QUEEN);
        }
        dialog.remove();
        return false;
    });
    this._node.append(dialog);
};

BoardView.prototype._addClickListener = function() {
    this._node.click($.proxy(function(event) {
        var offset = this._node.offset();
        var row = Math.floor((event.pageY - offset.top) / BoardView.CELL_SIZE);
        var col = Math.floor((event.pageX - offset.left) / BoardView.CELL_SIZE);
        var coords = this._getCoords(row, col);
        var element = $(event.target);
        if (element.hasClass('rotate')) {
            this._rotateBoard();
        }
        if (this._state.isEnded()) {
            return false;
        }
        if (element.hasClass('piece')) {
            if (this._piece && this._piece.row == coords.row && this._piece.col == coords.col) {
                this._deselectPiece();
            } else {
                this._selectPiece(coords.row, coords.col);
            }
        }
        if (!this._piece) {
            return false;
        }
        var piece = this._board.getPieceByCoords(this._piece.row, this._piece.col);
        if (element.hasClass('move')) {
            this.emit('move', function() {
                return [piece, coords.row, coords.col];
            });
        }
        if (element.hasClass('attack')) {
            this.emit('attack', function() {
                return [piece, coords.row, coords.col];
            });
        }
        if (element.hasClass('en-passant')) {
            this.emit('en-passant', function() {
                return [piece, coords.row, coords.col];
            });
        }
        if (element.hasClass('promotion')) {
            this._showPromotionDialog(element, $.proxy(function(replacement) {
                this.emit('promotion', function() {
                    return [piece, coords.row, coords.col, replacement];
                });
            }, this));
        }
        if (element.hasClass('long-castling')) {
            this.emit('castling', function() {
                return [piece, 'long'];
            });
        }
        if (element.hasClass('short-castling')) {
            this.emit('castling', function() {
                return [piece, 'short'];
            });
        }
        return false;
    }, this));    
};

BoardView.prototype._init = function() {
    this._createField();
    this._addBoardListeners();
    this._addClickListener();
};
