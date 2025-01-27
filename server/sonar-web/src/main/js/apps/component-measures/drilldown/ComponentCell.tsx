/*
 * SonarQube
 * Copyright (C) 2009-2021 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
import * as React from 'react';
import { Link } from 'react-router';
import BranchIcon from '../../../components/icons/BranchIcon';
import LinkIcon from '../../../components/icons/LinkIcon';
import QualifierIcon from '../../../components/icons/QualifierIcon';
import { translate } from '../../../helpers/l10n';
import { isDiffMetric } from '../../../helpers/measures';
import { splitPath } from '../../../helpers/path';
import {
  getBranchLikeUrl,
  getComponentDrilldownUrlWithSelection,
  getComponentSecurityHotspotsUrl,
  getProjectUrl
} from '../../../helpers/urls';
import { BranchLike } from '../../../types/branch-like';
import { isFileType, isSecurityReviewMetric, View } from '../utils';

interface Props {
  branchLike?: BranchLike;
  component: T.ComponentMeasureEnhanced;
  onClick: (component: string) => void;
  metric: T.Metric;
  rootComponent: T.ComponentMeasure;
  view: View;
}

export default class ComponentCell extends React.PureComponent<Props> {
  handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const isLeftClickEvent = event.button === 0;
    const isModifiedEvent = !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

    if (isLeftClickEvent && !isModifiedEvent) {
      event.preventDefault();
      this.props.onClick(this.props.component.key);
    }
  };

  renderInner(componentKey: string) {
    const { component } = this.props;
    let head = '';
    let tail = component.name;

    if (
      this.props.view === 'list' &&
      ['FIL', 'UTS', 'DIR'].includes(component.qualifier) &&
      component.path
    ) {
      ({ head, tail } = splitPath(component.path));
    }

    const isApp = this.props.rootComponent.qualifier === 'APP';

    return (
      <span title={componentKey}>
        <QualifierIcon className="little-spacer-right" qualifier={component.qualifier} />
        {head.length > 0 && <span className="note">{head}/</span>}
        <span>{tail}</span>
        {isApp &&
          (component.branch ? (
            <>
              <BranchIcon className="spacer-left little-spacer-right" />
              <span className="note">{component.branch}</span>
            </>
          ) : (
            <span className="spacer-left badge">{translate('branches.main_branch')}</span>
          ))}
      </span>
    );
  }

  render() {
    const { branchLike, component, metric, rootComponent } = this.props;

    let hotspotsUrl;
    if (isFileType(component) && isSecurityReviewMetric(metric.key)) {
      hotspotsUrl = getComponentSecurityHotspotsUrl(this.props.rootComponent.key, {
        file: component.path,
        sinceLeakPeriod: isDiffMetric(metric.key) ? 'true' : undefined
      });
    }

    return (
      <td className="measure-details-component-cell">
        <div className="text-ellipsis">
          {!component.refKey ? (
            <Link
              className="link-no-underline"
              to={
                hotspotsUrl ||
                getComponentDrilldownUrlWithSelection(
                  rootComponent.key,
                  component.key,
                  metric.key,
                  branchLike
                )
              }
              id={'component-measures-component-link-' + component.key}
              onClick={hotspotsUrl ? undefined : this.handleClick}>
              {this.renderInner(component.key)}
            </Link>
          ) : (
            <Link
              className="link-no-underline"
              id={'component-measures-component-link-' + component.refKey}
              to={
                this.props.rootComponent.qualifier === 'APP'
                  ? getProjectUrl(component.refKey, component.branch)
                  : getBranchLikeUrl(component.refKey, branchLike)
              }>
              <span className="big-spacer-right">
                <LinkIcon />
              </span>
              {this.renderInner(component.refKey)}
            </Link>
          )}
        </div>
      </td>
    );
  }
}
