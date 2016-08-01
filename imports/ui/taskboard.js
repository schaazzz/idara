import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Epics } from '../api/epics';
import { Issues } from '../api/issues';
import './taskboard.html';

Template.taskboard.onRendered(function onRendered() {
    var options = {
        width: 4,
        float: false,
        animate: true,
        cellHeight: 50,
        verticalMargin: 10,
        disableDrag: false,
        removeTimeout: 100,
        disableResize: true,
        acceptWidgets: '.grid-stack-item',
    };

    $('#grid-new-epics').gridstack(options);
    $('#grid-icebox').gridstack(options);
    $('#grid-backlog').gridstack(options);
    $('#grid-in-progress').gridstack(options);
    $('#grid-testing').gridstack(options);
    $('#grid-closed').gridstack(options);

    // var items = [
    //     {x: 0, y: 0, width: 4, height: 2},
    //     {x: 0, y: 1, width: 4, height: 2},
    //     {x: 0, y: 2, width: 4, height: 2},
    //     {x: 0, y: 3, width: 4, height: 2},
    //     {x: 0, y: 4, width: 4, height: 2}
    // ];

    $('.grid-stack').each(function () {
        var grid = $(this).data('gridstack');
        var items;
        var x = 0, y = 0, w = 4, h = 2;

        console.log(this.id);
        if (this.id == 'grid-new-epics') {
            items = Epics.find({'state': 'New'}).fetch();
        } else if (this.id == 'grid-icebox') {
            items = Epics.find({'state': 'Icebox'}).fetch();
        } else if (this.id == 'grid-backlog') {
            items = Epics.find({'state': 'Backlog'}).fetch();
        } else if (this.id == 'grid-in-progress') {
            items = Epics.find({'state': 'InProgress'}).fetch();
        } else if (this.id == 'grid-testing') {
            items = Epics.find({'state': 'Testing'}).fetch();
        } else if (this.id == 'grid-closed') {
            items = Epics.find({'state': 'Closed'}).fetch();
        }

        _.each(items, function (node) {
            let itemClass = 'grid-stack-item-content-none';

            if (node.priority == 'Very Low') {
                itemClass = 'grid-stack-item-content-very-low';
            } else if (node.priority == 'Low') {
                itemClass = 'grid-stack-item-content-low';
            } else if (node.priority == 'Mid') {
                itemClass = 'grid-stack-item-content-mid';
            } else if (node.priority == 'High') {
                itemClass = 'grid-stack-item-content-high';
            } else if (node.priority == 'Very High') {
                itemClass = 'grid-stack-item-content-very-high';
            }

            var widgetContent =
                '<strong>Title: </strong>' + node.title +
                '<br><strong>Priority: </strong>' + node.priority +
                '<br><strong>Assignee: </strong>' + node.responsible;

            grid.addWidget(
                $('<div class="grid-stack-item"><div class="grid-stack-item-content small ' + itemClass + '">' + widgetContent + '</div></div>'),
                x, y, w, h);
                y += 1;
        }, this);
    });

    $('.grid-stack').each(function () {
        var grid = $(this).data('gridstack');

        if (grid.isAreaEmpty()) {
            $(this).attr('data-gs-current-height', 2);
            $(this).css('height', '110px');
        }
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

            GridStackUI.Utils.sort(grid.grid.nodes);
        });
    });

    $('.grid-stack').on('dragstart', function(event, ui) {
        var grid = this;
        var element = event.target;

    });

    $('.grid-stack').on('dragstop', function(event, ui) {
        var grid = this;
        var element = event.target;
    });
    $('.grid-stack-item').draggable({
        revert: false,
        // snap: true,
        // snapMode: 'inner',
        // snapTolerance: 50,
        handle: '.grid-stack-item-content',
        scroll: false,
        appendTo: 'body',
        // axis: 'x',
    });
});

Template.taskboard.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    newEpics() {
        return Epics.find({'state': 'New'}).count();
    },
    icebox() {
        return Epics.find({'state': 'Icebox'}).count();
    },
    backlog() {
        return Epics.find({'state': 'Backlog'}).count();
    },
    inProgress() {
        return Epics.find({'state': 'InProgress'}).count();
    },
    testing() {
        return Epics.find({'state': 'Testing'}).count();
    },
    closed() {
        return Epics.find({'state': 'Closed'}).count();
    },
});
