import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import {Projects} from '../api/projects';
import {Issues} from '../api/issues';
import {History} from '../api/history';
import './project-stats.html';

Template.projectStats.onCreated(function onCreated() {
});

Template.projectStats.onRendered(function onRendered() {
    var colors = [
        '#4682B4', '#FF6347', '#FFDAB9', '#FFA500', '#32CD32',
        '#800080', '#808080', '#F0E68C', '#CD5C5C', '#E0FFFF',
        '#008000', '#0000FF', '#800000', '#808000', '#C71585',
        '#CD853F', '#FF4500', '#FFFF00', '#FF69B4', '#DDA0DD',
    ];

    var workflow = Projects.findOne({'name': activeProject.get()}).workflow;

    var issueData = {
        labels: [],
        datasets: [{
            data: [],
            backgroundColor: [],
            hoverBackgroundColor: []
        }]
    };

    for (var i = 0; i < workflow.length - 1; i++) {
        issueData.labels.push(workflow[i].stateName);

        var issues = Issues.find({'project': activeProject.get(), 'state': workflow[i].stateName});

        var count = 0;
        if (issues) {
            count = issues.count();
        }

        issueData.datasets[0].data.push(count);
        issueData.datasets[0].backgroundColor.push(colors[i]);
        issueData.datasets[0].hoverBackgroundColor.push(colors[i]);
    }

    var ctx0 = document.getElementById("myChart0").getContext("2d");
    ctx0.height = 200;

    var myDoughnutChart0 = new Chart(ctx0, {
        type: 'pie',
        data: issueData,
        options: {
            legend: {
                fullWidth: true,
                position: 'bottom',
                labels: {
                    boxWidth: 13,
                    fontSize: 13,
                    padding: 7,
                }
            }
        }
    });

    let history = History.findOne({'project': activeProject.get()});
    console.log(history.data);
    Object.keys(history.data).forEach(function (date) {
        console.log('==>', date);
        Object.keys(history.data[date]).forEach(function (count) {
            console.log('====>', count);
            Object.keys(history.data[date][count]).forEach(function (values) {
                console.log('=========>', history.data[date][count][values]);
            });
        });
    });
});

Template.projectStats.helpers({
    count() {
        var workflow = Projects.findOne({'name': activeProject.get()}).workflow;
        var totalCount = 0;

        for (var i = 0; i < workflow.length - 1; i++) {
            var count = 0;
            var issues = Issues.find({'project': activeProject.get(), 'state': workflow[i].stateName});
            if (issues) {
                count = issues.count();
            }

            totalCount += count;
        }

        return (totalCount);
    }

});

Template.projectStats.events({

});
