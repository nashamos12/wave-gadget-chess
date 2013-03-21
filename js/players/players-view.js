var PlayersView = function(players) {
    this._players = players;
    this._node = null;
    this._init();
};

PlayersView.prototype._onSetPlayer = function(color, player) {
    var node = this._node.find('.player.' + color + ' .avatar');
    node.attr('title', player.getName());
    node.css('background-image', 'url(' + player.getAvatar() + ')');
};

PlayersView.prototype._onTurn = function(color) {
    this._node.find('.turn').removeClass('turn');
    var node = this._node.find('.' + color);
    node.addClass('turn');
};

PlayersView.prototype._init = function() {
    this._node = $('.players');
    this._players.on('set', $.proxy(this._onSetPlayer, this));
    this._players.on('turn', $.proxy(this._onTurn, this));
};
