import { event as d3_event, select as d3_select } from 'd3-selection';

import { geoExtent, geoPointInPolygon } from '../geo';
import { modeSelect } from '../modes/select';
import { uiLasso } from '../ui/lasso';


export function behaviorLasso(context) {

    // use pointer events on supported platforms; fallback to mouse events
    var _pointerPrefix = 'PointerEvent' in window ? 'pointer' : 'mouse';

    var behavior = function(selection) {
        var lasso;


        function mousedown() {
            var button = 0;  // left
            if (d3_event.button === button && d3_event.shiftKey === true) {
                lasso = null;

                d3_select(window)
                    .on(_pointerPrefix + 'move.lasso', mousemove)
                    .on(_pointerPrefix + 'up.lasso', mouseup);

                d3_event.stopPropagation();
            }
        }


        function mousemove() {
            if (!lasso) {
                lasso = uiLasso(context);
                context.surface().call(lasso);
            }

            lasso.p(context.map().mouse());
        }


        function normalize(a, b) {
            return [
                [Math.min(a[0], b[0]), Math.min(a[1], b[1])],
                [Math.max(a[0], b[0]), Math.max(a[1], b[1])]
            ];
        }


        function lassoed() {
            if (!lasso) return [];

            var graph = context.graph();
            var bounds = lasso.extent().map(context.projection.invert);
            var extent = geoExtent(normalize(bounds[0], bounds[1]));

            var intersects = context.history().intersects(extent).filter(function(entity) {
                return entity.type === 'node' &&
                    geoPointInPolygon(context.projection(entity.loc), lasso.coordinates) &&
                    !context.features().isHidden(entity, graph, entity.geometry(graph));
            });

            return intersects.map(function(entity) { return entity.id; });
        }


        function mouseup() {
            d3_select(window)
                .on(_pointerPrefix + 'move.lasso', null)
                .on(_pointerPrefix + 'up.lasso', null);

            if (!lasso) return;

            var ids = lassoed();
            lasso.close();

            if (ids.length) {
                context.enter(modeSelect(context, ids));
            }
        }

        selection
            .on(_pointerPrefix + 'down.lasso', mousedown);
    };


    behavior.off = function(selection) {
        selection.on(_pointerPrefix + 'down.lasso', null);
    };


    return behavior;
}
