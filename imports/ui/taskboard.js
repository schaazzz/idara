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
        removable: '.trash',
        removeTimeout: 100,
        acceptWidgets: '.grid-stack-item'
    };
    $('#grid1').gridstack(options);
    $('#grid2').gridstack(options);
    $('#grid3').gridstack(options);
    $('#grid4').gridstack(options);
    $('#grid5').gridstack(options);
    $('#grid6').gridstack(options);
    // $('#grid2').gridstack(_.defaults({
    //     float: false
    // }, options));
    // $('#grid3').gridstack(_.defaults({
    //     float: false
    // }, options));
    // $('#grid4').gridstack(_.defaults({
    //     float: false
    // }, options));
    // $('#grid5').gridstack(_.defaults({
    //     float: false
    // }, options));
    // $('#grid6').gridstack(_.defaults({
    //     float: false
    // }, options));

    var items = [
        {x: 0, y: 0, width: 2, height: 2},
        {x: 0, y: 1, width: 2, height: 2},
        {x: 0, y: 2, width: 2, height: 2},
        {x: 0, y: 3, width: 2, height: 2},
        {x: 0, y: 4, width: 2, height: 2}
    ];
    $('.grid-stack').each(function () {
        var grid = $(this).data('gridstack');
        console.log(grid);
        let index = 0;
        _.each(items, function (node) {
            index += 1;
            grid.addWidget($('<div class="grid-stack-item"><div class="grid-stack-item-content">' + index + '</div></div>'),
                node.x, node.y, node.width, node.height);
        }, this);
    });
    $('.sidebar .grid-stack-item').draggable({
        revert: 'invalid',
        handle: '.grid-stack-item-content',
        scroll: true,
        appendTo: 'body'
    });
});

Template.taskboard.helpers({
    project() {
        return Projects.findOne({'name': activeProject.get()});
    }
});
