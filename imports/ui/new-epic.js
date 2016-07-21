import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Projects } from '../api/projects';
import { Issues } from '../api/issues';
import { Files } from '../api/files';
import './new-epic.html';

let refreshIssuePopup = new ReactiveVar(true);
let issuesUpdated = new ReactiveVar(false);
var attachedFilesDict = new ReactiveDict('newEpicArray');
let selectedIssues = [];
var imUploading = new ReactiveVar(false);

function parseImageSrc(imageUrl) {
    var url = imageUrl;
    var filename = url;

    var projectId = Projects.findOne({'name': activeProject.get()})._id;

    if (url.search('/') < 0) {
        var file = Files.findOne({filename: url, 'metadata.project': projectId});
        filename = url;

        if (file) {
            url = Files.baseURL + '/md5/' + file.md5;
        }
    } else {
        filename = filename.substr(filename.lastIndexOf('/') + 1);
    }

    return {
        url: url,
        filename: filename
    };
}

Template.newEpic.onDestroyed(function onDestroyed() {
    imUploading.set(false);
    Files.resumable.unAssignDrop($("#div-attach-files-to-epic"));
});

Template.newEpic.onCreated(function onCreated() {
    selectedIssues = [];
    imUploading.set(true);
    attachedFilesDict.set('newEpicArray', []);
});

Template.newEpic.onRendered(function onRendered() {

    Files.resumable.assignBrowse($("#a-attach-file-to-epic"));
    Files.resumable.assignDrop($("#div-attach-files-to-epic"));

    if (editEpic.get()) {
    }
});

Meteor.startup(function() {
    Files.resumable.on('fileAdded', function (file) {
        if (!imUploading.get()) {
            return;
        }

        Session.set(file.uniqueIdentifier, 0);

        var attachedFilesArray = attachedFilesDict.get('newEpicArray');
        attachedFilesArray.push(new Mongo.ObjectID(file.uniqueIdentifier));
        attachedFilesDict.set('newEpicArray', attachedFilesArray);

        return Files.insert({
            _id: file.uniqueIdentifier,
            filename: file.fileName,
            metadata: {
                author: Meteor.user()._id,
                project: Projects.findOne({'name': activeProject.get()})._id,
                epic: void 0,
                issue: void 0
            },
            contentType: file.file.type
        }, function (error, _id) {
            if (error)  {
                console.warn('File creation failed!', error);
                return;
            }

            return Files.resumable.upload();
        });
    });

    Files.resumable.on('fileProgress', function (file) {
        return Session.set(file.uniqueIdentifier, Math.floor(100 * file.progress()));
    });

    Files.resumable.on('fileSuccess', function (file) {
        return Session.set(file.uniqueIdentifier, void 0);
    });

    return Files.resumable.on('fileError', function (file) {
        return Session.set(file.uniqueIdentifier, void 0);
    });
});

Template.newEpic.helpers({
    numAttachedFiles() {
        return Files.find({
            'metadata._Resumable': {$exists: false},
            'length': {$ne: 0},
            _id: {
                $in: attachedFilesDict.get('newEpicArray')
            }
        }).count();
    },
    attachements() {
        return Files.find({
            _id: {
                $in: attachedFilesDict.get('newEpicArray')
            }
        });
    },
    link() {
        result = {path: Files.baseURL + '/md5/' + this.md5, filename: this.filename};

        if (this.filename.indexOf('_Resumable_') >= 0 ) {
            result = null;
        }

        return (result);
    },
    uploadProgress() {
        var percent = Session.get("" + this._id._str);
        var result = void 0;

        if (percent) {
            var filename = '';

            if (this.metadata._Resumable) {
                filename = this.metadata._Resumable.resumableFilename;
            } else {
                filename = this.filename;
            }

            result = 'Uploading "' + filename + '": ' + percent + '%';
        }

        return result;
    },
    users() {
        return Meteor.users.find({});
    },
    project() {
        return Projects.findOne({'name': activeProject.get()});
    },
    issues() {
        if (refreshIssuePopup.get()) {
            refreshIssuePopup.set(false);
        }

        return Issues.find({'project': activeProject.get(), 'state': 'Open', 'number': {$nin: selectedIssues}}).map(function (issue, index) {
            if (index == 0) {
                issue.first = true;
            }

            return (issue);
        });
    },
    numEpicIssues() {
        if (issuesUpdated.get()) {
            issuesUpdated.set(false);
        }

        return selectedIssues.length;
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
    'click #a-delete-file'(event, template) {
        Files.remove({'_id': this._id});
    },
    'click #btn-add-epic'(event, template) {
        var title = template.find('#epic-title').value;
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

        if (editEpic.get()) {
            Meteor.call('epics.update', activeProject.get(), parseInt(activeEpic.get()), title, descriptionHtml, descriptionMarkdown, selectedIssues, priority, responsible, attachedFilesDict.get('newEpicArray'));
        } else {
            Meteor.call('epics.insert', activeProject.get(), title, descriptionHtml, descriptionMarkdown, selectedIssues, priority, responsible, attachedFilesDict.get('newEpicArray'));
        }

        target.set('projectPage');

    },
    'click #a-attach-issue-to-epic'(event, template) {
        $('#modal-issues').modal();
    },
    'click [name=a-open-issue-page]'(event, template) {
        var project = event.target.id;
        var issue = project.split(':')[1];

        project = project.split(':')[0];
        activeProject.set(project);
        activeIssue.set(issue);
        target.set('issuePage');
    },
    'click [name=a-delete-issue]'(event, template) {
        let value = parseInt(event.target.id)
        issuesUpdated.set(true);
        refreshIssuePopup.set(true);
        if (selectedIssues.indexOf(value) >= 0) {
            selectedIssues.splice(selectedIssues.indexOf(value), 1);
        }
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
