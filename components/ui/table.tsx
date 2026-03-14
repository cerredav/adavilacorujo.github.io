import * as React from 'react';

export const Table = (props: React.TableHTMLAttributes<HTMLTableElement>) => <table {...props} style={{ width: '100%', borderCollapse: 'collapse' }} />;
export const Th = (props: React.ThHTMLAttributes<HTMLTableCellElement>) => <th {...props} style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0', padding: '8px' }} />;
export const Td = (props: React.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px' }} />;
