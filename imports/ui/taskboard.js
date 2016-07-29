import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Epics } from '../api/epics';
import { Issues } from '../api/issues';
import './taskboard.html';

Template.taskboard.onRendered(function onRendered() {
    var options = {
        width: 6,
        float: false,
        animate: true,
        cellHeight: 50,
        verticalMargin: 10,
        disableDrag: false,
        removeTimeout: 100,
        disableResize: true,
        acceptWidgets: '.grid-stack-item',
    };

    $('#grid1').gridstack(options);
    $('#grid2').gridstack(options);
    $('#grid3').gridstack(options);
    $('#grid4').gridstack(options);
    $('#grid5').gridstack(options);
    $('#grid6').gridstack(options);

    var items = [
        {x: 0, y: 0, width: 2, height: 2},
        {x: 0, y: 1, width: 2, height: 2},
        {x: 0, y: 2, width: 2, height: 2},
        {x: 0, y: 3, width: 2, height: 2},
        {x: 0, y: 4, width: 2, height: 2}
    ];
    let index = 0;
    $('.grid-stack').each(function () {
        var grid = $(this).data('gridstack');

        _.each(items, function (node) {
            index += 1;
            grid.addWidget($('<div class="grid-stack-item"><div class="grid-stack-item-content">' + index + '</div></div>'),
                node.x, node.y, node.width, node.height);
        }, this);
    });

    $('.grid-stack').on('added', function(event, items) {
        for (var i = 0; i < items.length; i++) {

        }
    });

    $('.grid-stack').on('change', function(event, items) {
        for (var i = 0; i < items.length; i++) {

        }

        $('.grid-stack').each(function () {
            var grid = $(this).data('gridstack');

            if (grid.isAreaEmpty()) {
                $(this).attr('data-gs-current-height', 2);
                $(this).css('height', '110px');
            }
        });
    });

    $('.grid-stack').on('dragstart', function(event, ui) {
        var grid = this;
        var element = event.target;

    });

    $('.grid-stack').on('dragstop', function(event, ui) {
        var grid = this;
        var element = event.target;
        // console.log('dragstop', grid, element);
    });
    $('.grid-stack-item').draggable({
        revert: false,
        // snap: true,
        // snapMode: 'inner',
        // snapTolerance: 50,
        handle: '.grid-stack-item-content',
        scroll: true,
        appendTo: 'parent',
        axis: 'x',
    });
});

Template.taskboard.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    }
});
