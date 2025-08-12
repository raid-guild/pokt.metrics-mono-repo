import { Widget } from '@skip-go/widget';

export const SwapWidget = () => {
  return (
    <div className="h-full">
      <Widget
        theme={{
          brandColor: '#09279F',
          borderRadius: {
            main: '25px',
            selectionButton: '10px',
            ghostButton: '30px',
            modalContainer: '20px',
            rowItem: '12px',
          },
          primary: {
            background: {
              normal: '#F2F2F2',
            },
            text: {
              normal: '#000000',
              lowContrast: '#00000080',
              ultraLowContrast: '#0000004D',
            },
            ghostButtonHover: '#00000066',
          },
          secondary: {
            background: {
              normal: '#F2F2F2',
              transparent: '#F2F2F2B3',
              hover: '#F2F2F2',
            },
          },
          success: {
            text: '#60BC29',
          },
          warning: {
            background: '#411f00',
            text: '#ff7a00',
          },
          error: {
            background: '#430000',
            text: '#E03834',
          },
        }}
        filterOut={{
          source: {},
          destination: {},
        }}
        routeConfig={{
          allowMultiTx: true,
        }}
        settings={{
          slippage: 1,
          useUnlimitedApproval: true,
        }}
        chainIdsToAffiliates={undefined}
      />
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 w-full">
        <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
      </div>
    </div>
  );
};
