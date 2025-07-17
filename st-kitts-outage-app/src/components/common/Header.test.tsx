import React from 'react';
import { render } from '@testing-library/react';
import Header from '../../components/common/Header';

test('renders Header component', () => {
  const { getByText } = render(<Header />);
  const linkElement = getByText(/header text/i);
  expect(linkElement).toBeInTheDocument();
});