var BoardView = function(board) {
    this._board = board;
    this._piece = null;
    this._node = null;
};

BoardView.prototype._createField = function() {
    var node = $('.board');
    for (var i = 0; i < Board.SIZE; i += 1) {
        var row = $('<div class="row"></div>');
        for (var j = 0; j < Board.SIZE; j += 1) {
            var cell = $('<div class="cell"></div>');
            row.append(cell);
        }
        row.append('<div class="number">' + (Board.SIZE - i) + '</div>');
        node.append(row);
    }
    var row = $('<div></div>');
    for (var i = 0; i < Board.SIZE; i += 1) {
        var letter = String.fromCharCode(97 + i);
        row.append('<div class="letter">' + letter + '</div>');
    }
    node.append(row);
    this._node = node;
};

BoardView.prototype._getCell = function(row, col) {
    return this._node.find('.row:eq(' + row + ') .cell:eq(' + col + ')');
};

BoardView.prototype._onPlace = function(row, col, piece) {
    var cell = this._getCell(row, col);
    var node = $('<div class="icon piece ' + piece.getType() + ' ' + piece.getColor() + '"></div>');
    cell.append(node);
};

BoardView.prototype._onRemove = function(row, col) {
    var cell = this._getCell(row, col);
    cell.find('.piece').remove();
};

BoardView.prototype._choosePiece = function(row, col) {
    this._node.find('.chosen').remove();
    var cell = this._getCell(row, col);
    var node = $('<div class="icon chosen"></div>');
    cell.append(node);
    this._piece = {
        row: row,
        col: col
    };
};

BoardView.prototype._showAvailableMoves = function(row, col) {
    this._node.find('.move, .attack').remove();
    var piece = this._board.getPieceByCoords(row, col);
    var search = new MoveSearch(this._board, piece);
    var moves = search.get();
    for (var i in moves) {
        var move = moves[i];
        if (move.check) {
            continue;
        }
        var cell = this._getCell(move.row, move.col);;
        var node = $('<div class="icon ' + (move.attack ? 'attack' : 'move') + '"></div>');
        cell.append(node);
    }
};

BoardView.prototype._addClickListener = function() {
    this._node.click($.proxy(function(event) {
        var offset = this._node.offset();
        var row = Math.floor((event.pageY - offset.top) / Board.CELL_SIZE);
        var col = Math.floor((event.pageX - offset.left) / Board.CELL_SIZE);
        var element = $(event.target);
        if (element.hasClass('piece')) {
            this._choosePiece(row, col);
            this._showAvailableMoves(row, col);
        }
        if (element.hasClass('move')) {
            
        }
        if (element.hasClass('attack')) {
            
        }
    }, this));    
};

BoardView.prototype.init = function() {
    this._createField();
    this._board.setCallbacks($.proxy(this._onPlace, this), $.proxy(this._onRemove, this));
    this._addClickListener();
};