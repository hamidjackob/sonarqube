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
import { shallow } from 'enzyme';
import { clone } from 'lodash';
import * as React from 'react';
import { getSecurityHotspotDetails } from '../../../../api/security-hotspots';
import { scrollToElement } from '../../../../helpers/scrolling';
import { mockComponent } from '../../../../helpers/testMocks';
import { waitAndUpdate } from '../../../../helpers/testUtils';
import HotspotViewer from '../HotspotViewer';
import HotspotViewerRenderer from '../HotspotViewerRenderer';

const hotspotKey = 'hotspot-key';

jest.mock('../../../../api/security-hotspots', () => ({
  getSecurityHotspotDetails: jest.fn().mockResolvedValue({ id: `I am a detailled hotspot` })
}));

jest.mock('../../../../helpers/scrolling', () => ({
  scrollToElement: jest.fn()
}));

it('should render correctly', async () => {
  const wrapper = shallowRender();
  expect(wrapper).toMatchSnapshot();

  await waitAndUpdate(wrapper);

  expect(wrapper).toMatchSnapshot();
  expect(getSecurityHotspotDetails).toHaveBeenCalledWith(hotspotKey);

  const newHotspotKey = `new-${hotspotKey}`;
  wrapper.setProps({ hotspotKey: newHotspotKey });

  await waitAndUpdate(wrapper);
  expect(getSecurityHotspotDetails).toHaveBeenCalledWith(newHotspotKey);
});

it('should refresh hotspot list on status update', () => {
  const onUpdateHotspot = jest.fn();
  const wrapper = shallowRender({ onUpdateHotspot });
  wrapper
    .find(HotspotViewerRenderer)
    .props()
    .onUpdateHotspot(true);
  expect(onUpdateHotspot).toHaveBeenCalled();
});

it('should NOT refresh hotspot list on assignee/comment updates', () => {
  const onUpdateHotspot = jest.fn();
  const wrapper = shallowRender({ onUpdateHotspot });
  wrapper
    .find(HotspotViewerRenderer)
    .props()
    .onUpdateHotspot();
  expect(onUpdateHotspot).not.toHaveBeenCalled();
});

it('should open comment form when scroll to comment', () => {
  const wrapper = shallowRender();
  const mockTextRef = ({ current: { focus: jest.fn() } } as any) as React.RefObject<
    HTMLTextAreaElement
  >;
  wrapper.instance().commentTextRef = mockTextRef;

  wrapper.find(HotspotViewerRenderer).simulate('openComment');

  expect(wrapper.state().commentVisible).toBe(true);
  expect(mockTextRef.current?.focus).toHaveBeenCalled();
  expect(scrollToElement).toHaveBeenCalledWith(mockTextRef.current, expect.anything());
});

it('should close comment', () => {
  const wrapper = shallowRender();
  wrapper.setState({ commentVisible: true });
  wrapper.find(HotspotViewerRenderer).simulate('closeComment');
  expect(wrapper.state().commentVisible).toBe(false);
});

it('should reset loading even on fetch error', async () => {
  const mockGetHostpot = getSecurityHotspotDetails as jest.Mock;
  mockGetHostpot.mockRejectedValueOnce({});

  const wrapper = shallowRender();
  await waitAndUpdate(wrapper);

  expect(wrapper.state().loading).toBe(false);
});

it('should keep state on unmoint', () => {
  const wrapper = shallowRender();
  wrapper.instance().componentWillUnmount();
  const prevState = clone(wrapper.state());

  wrapper.find(HotspotViewerRenderer).simulate('updateHotspot');
  expect(wrapper.state()).toStrictEqual(prevState);
});

function shallowRender(props?: Partial<HotspotViewer['props']>) {
  return shallow<HotspotViewer>(
    <HotspotViewer
      component={mockComponent()}
      hotspotKey={hotspotKey}
      onUpdateHotspot={jest.fn()}
      securityCategories={{ cat1: { title: 'cat1' } }}
      {...props}
    />
  );
}
