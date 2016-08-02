import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Epics } from '../api/epics';
import { Issues } from '../api/issues';
import './taskboard.html';

let cardDragstart = {epicId: undefined, parentId: undefined, trigger: false};

Template.taskboard.onRendered(function onRendered() {
    var defaultOptions = {
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

    var iceboxOptions = jQuery.extend(true, {}, defaultOptions);
    iceboxOptions.disableDrag = true;
    iceboxOptions.acceptWidgets = undefined;

    $('#grid-new-epics').gridstack(defaultOptions);
    $('#grid-backlog').gridstack(defaultOptions);
    $('#grid-in-progress').gridstack(defaultOptions);
    $('#grid-testing').gridstack(defaultOptions);
    $('#grid-closed').gridstack(defaultOptions);
    $('#grid-icebox').gridstack(iceboxOptions);

    $('.grid-stack').each(function () {
        var grid = $(this).data('gridstack');
        var items;
        var x = 0, y = 0, w = 4, h = 2;

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
                '<br><strong>Assignee: </strong>' + node.responsible +
                '<br><strong>Progress: </strong>' + node.progress + '%' +
                '<div class="row" style="padding-bottom: 0px; padding-top: 1px;">' +
                    '<div class="col-xs-12">' +
                        '<a href="#nolink" id="a-edit-epic" class="pull-left" style="font-size: 17px; margin-left: 0px;">' +
                        '<span class="pull-left glyphicon glyphicon-edit" style="margin-top: 10px; color: black"></span>' +
                        '</a>' +
                        '<a href="#nolink" id="a-view-epic" class="pull-left" style="font-size: 17px; margin-left: 5px;">' +
                        '<span class="pull-left glyphicon glyphicon-eye-open" style="margin-top: 10px; color: black"></span>' +
                        '</a>' +
                        '<a href="#nolink" id="a-delete-epic" class="pull-left" style="font-size: 17px; margin-left: 5px;">' +
                            '<span class="pull-left glyphicon glyphicon-trash" style="margin-top: 10px; color: black"></span>' +
                        '</a>' +
                    '</div>' +
                '</div>';

            grid.addWidget(
                $('<div class="grid-stack-item"' + ' id="' + node.project + ':' + node.number + '""><div class="grid-stack-item-content small ' + itemClass  + '">' + widgetContent +  '</div></div>'),
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
        var newParentId = this.id;

        if (cardDragstart.trigger) {
            cardDragstart.trigger = false;

            if (newParentId != cardDragstart.parentId) {
                var project = cardDragstart.epicId.split(':')[0];
                var number = parseInt(cardDragstart.epicId.split(':')[1]);
                var newState = '';

                if (newParentId == 'grid-new-epics') {
                    newState = 'New';
                } else if (newParentId == 'grid-icebox') {
                    newState = 'Icebox';
                } else if (newParentId == 'grid-backlog') {
                    newState = 'Backlog';
                } else if (newParentId == 'grid-in-progress') {
                    newState = 'InProgress';
                } else if (newParentId == 'grid-testing') {
                    newState = 'Testing';
                } else if (newParentId == 'grid-closed') {
                    newState = 'Closed';
                }

                Meteor.call('epics.setState', project, number, newState);
            }

            cardDragstart.parentId = undefined;
            cardDragstart.epicId = undefined;
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

        cardDragstart.trigger = true;
        cardDragstart.epicId = element.id;
        cardDragstart.parentId = this.id;

    });

    $('.grid-stack').on('dragstop', function(event, ui) {
        var grid = this;
        var element = event.target;

        if (cardDragstart.trigger) {
            cardDragstart.trigger = false;
            cardDragstart.epicId = undefined;
            cardDragstart.parentId = undefined;
        }
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
