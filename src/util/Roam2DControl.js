
import Base from 'claygl/src/core/Base';
import retrieve from './retrieve';

/**
 * @alias module:echarts-gl/util/Roam2DControl
 */
var Roam2DControl = Base.extend(function () {

    return {
        /**
         * @type {module:zrender~ZRender}
         */
        zr: null,

        /**
         * @type {module:echarts-gl/core/ViewGL}
         */
        viewGL: null,

        minZoom: 0.2,

        maxZoom: 5,

        _needsUpdate: false,

        _dx: 0,
        _dy: 0,

        _zoom: 1
    };
}, function () {
    // Each Roam2DControl has it's own handler
    this._mouseDownHandler = this._mouseDownHandler.bind(this);
    this._mouseMoveHandler = this._mouseMoveHandler.bind(this);
    this._mouseUpHandler = this._mouseUpHandler.bind(this);
    this._update = this._update.bind(this);
}, {

    init: function () {
        var zr = this.zr;

        zr.on('mousedown', this._mouseDownHandler);
        zr.on('globalout', this._mouseUpHandler);

        zr.animation.on('frame', this._update);
    },

    setTarget: function (target) {
        this._target = target;
    },

    setZoom: function (zoom) {
        this._zoom = Math.max(Math.min(
            zoom, this.maxZoom
        ), this.minZoom);
        this._needsUpdate = true;
    },

    setOffset: function (offset) {
        this._dx = offset[0];
        this._dy = offset[1];

        this._needsUpdate = true;
    },

    getZoom: function () {
        return this._zoom;
    },

    getOffset: function () {
        return [this._dx, this._dy];
    },

    _update: function () {
        if (!this._target) {
            return;
        }
        if (!this._needsUpdate) {
            return;
        }

        var target = this._target;

        var scale = this._zoom;

        target.position.x = this._dx;
        target.position.y = this._dy;

        target.scale.set(scale, scale, scale);

        this.zr.refresh();

        this._needsUpdate = false;

        this.trigger('update');
    },

    _mouseDownHandler: function (e) {
        if (e.target) {
            return;
        }

        var x = e.offsetX;
        var y = e.offsetY;
        if (this.viewGL && !this.viewGL.containPoint(x, y)) {
            return;
        }

        this.zr.on('mousemove', this._mouseMoveHandler);
        this.zr.on('mouseup', this._mouseUpHandler);

        var pos = this._convertPos(x, y);

        this._x = pos.x;
        this._y = pos.y;
    },

    // Convert pos from screen space to viewspace.
    _convertPos: function (x, y) {

        var camera = this.viewGL.camera;
        var viewport = this.viewGL.viewport;
        // PENDING
        return {
            x: (x - viewport.x) / viewport.width * (camera.right - camera.left) + camera.left,
            y: (y - viewport.y) / viewport.height * (camera.bottom - camera.top) + camera.top
        };
    },

    _mouseMoveHandler: function (e) {

        var pos = this._convertPos(e.offsetX, e.offsetY);

        this._dx += pos.x - this._x;
        this._dy += pos.y - this._y;

        this._x = pos.x;
        this._y = pos.y;

        this._needsUpdate = true;
    },

    _mouseUpHandler: function (e) {
        this.zr.off('mousemove', this._mouseMoveHandler);
        this.zr.off('mouseup', this._mouseUpHandler);
    },

    dispose: function () {

        var zr = this.zr;
        zr.off('mousedown', this._mouseDownHandler);
        zr.off('mousemove', this._mouseMoveHandler);
        zr.off('mouseup', this._mouseUpHandler);
        zr.off('globalout', this._mouseUpHandler);

        zr.animation.off('frame', this._update);
    }
});

export default Roam2DControl;
