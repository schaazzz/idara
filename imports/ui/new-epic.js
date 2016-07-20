import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import { Files } from '../api/files';
import './new-epic.html';

let refreshIssuePopup = new ReactiveVar(true);
let issuesUpdated = new ReactiveVar(false);
let selectedIssues = [];

Template.newEpic.helpers({
    users() {
        return Meteor.users.find({});
    },
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    issues() {
        if (refreshIssuePopup.get()){
            refreshIssuePopup.set(false);
        }

        return Issues.find({'project': activeProject.get(), 'state': 'Open', 'number': {$nin: selectedIssues}}).map(function (issue, index) {
            if (index == 0) {
                issue.first = true;
            }

            return (issue);
        });
    },
    epicIssues() {
        if (issuesUpdated.get()) {
            issuesUpdated.set(false);
        }

        return Issues.find({'project': activeProject.get(), 'number': {$in: selectedIssues}}).map(function (issue, index) {
            if (index == 0) {
                issue.first = true;
            }

            return (issue);
        });
    }
});

Template.newEpic.events({
    'click #btn-add-issue'(event, template) {
        var priority = template.find('#select-priority').value;
        var responsible = template.find('#select-responsible :selected').text;

        var descriptionMarkdown = $('#epic-description').val();
        var reader = new commonmark.Parser();
        var writer = new commonmark.HtmlRenderer();

        var parsed = reader.parse(descriptionMarkdown);
        var result = writer.render(parsed);

        var tempResult = $(result);
        var outerHTML = '';
        for (i = 0; i < tempResult.length; i++) {
            if ($(tempResult[i]).find('img')[0]) {
                var imgSrc = parseImageSrc($(tempResult[i]).find('img').attr('src'));
                $(tempResult[i])
                    .html(
                        '<a href="#nolink" name="a-open-image">' +
                        $(tempResult[i])
                            .find('img')
                            .attr('src', imgSrc.url)
                            .attr('filename', imgSrc.filename)
                            .addClass('img-responsive')
                            .css('max-width', '50%')
                            .attr('align', 'middle')[0]
                            .outerHTML
                        + '</a>'
                    );
            }
        }

        for (i = 0; i < tempResult.length; i++) {
            if (tempResult[i].outerHTML) {
                outerHTML += tempResult[i].outerHTML;
            }
        }

        var descriptionHtml = outerHTML;

    },
    'click #a-attach-issue-to-epic'(event, template) {
        $('#modal-issues').modal();
    },
    'change [name=chk-select-issue]'(event, template) {
        let id = '#' + event.target.id;
        let value = parseInt(event.target.attributes.value.value);

        if ($(id).is(':checked')) {
            if (selectedIssues.indexOf(value) < 0) {
                selectedIssues.push(value);
            }
        } else {
            if (selectedIssues.indexOf(value) >= 0) {
                selectedIssues.splice(selectedIssues.indexOf(value), 1);
            }
        }
    },
    'click #btn-add-issues'(event, template) {
        issuesUpdated.set(true);
        refreshIssuePopup.set(true);
        $('#modal-issues').modal('toggle');
    },
    'click #btn-cancel-selection'(event, template) {
        refreshIssuePopup.set(true);
        $('#modal-issues').modal('toggle');
    }
});
