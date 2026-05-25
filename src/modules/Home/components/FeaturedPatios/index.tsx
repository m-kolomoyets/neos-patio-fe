import { useId, useRef } from 'react';
import ChevronLeftIcon from '@/icons/chevrone-left_24.svg?react';
import ChevronRightIcon from '@/icons/chevrone-right_24.svg?react';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { getFeaturedPatiosQueryOptions } from '@/services/patios/queries';
import { Button } from '@/components/ui/Button';
import { useCarouselMagneticScrub } from './hooks/useCarouselMagneticScrub';
import { useCarouselVideoScrub } from './hooks/useCarouselVideoScrub';
import { useFeaturedCarousel } from './hooks/useFeaturedCarousel';
import { FeaturedPatioCard } from '../FeaturedPatioCard';
import s from './styles.module.css';

export const FeaturedPatios: React.FC = () => {
    const { data, isLoading } = useQuery(getFeaturedPatiosQueryOptions());
    const viewportId = useId();

    const prevButtonRef = useRef<HTMLButtonElement>(null);
    const nextButtonRef = useRef<HTMLButtonElement>(null);

    const {
        emblaRef,
        emblaApi,
        snapList,
        scrollPrev,
        scrollNext,
        reducedMotion,
        videoCapable,
        slidesInViewWithNeighbors,
    } = useFeaturedCarousel({
        dataKey: data,
    });

    useCarouselVideoScrub({ emblaApi, enabled: !reducedMotion });
    useCarouselMagneticScrub({ emblaApi, prevRef: prevButtonRef, nextRef: nextButtonRef, enabled: videoCapable });

    const hasMultipleSlides = snapList.length > 1;
    const totalSlides = data?.length ?? 0;

    const handleSkipButtonClick = () => {
        document.getElementById('search-bar-trigger')?.focus();
    };

    return (
        <section className={s.wrap}>
            <Button className={s['skip-button']} variant="brand" size="md" onClick={handleSkipButtonClick}>
                Go to search bar
            </Button>
            <div className={s.scroll}>
                <div
                    ref={emblaRef}
                    id={viewportId}
                    className={s.viewport}
                    role="region"
                    aria-roledescription="carousel"
                    aria-label="Featured patios"
                >
                    <div className={s.track}>
                        {isLoading
                            ? Array.from({ length: 3 }).map((_, i) => {
                                  return <div key={i} className={s['skeleton-card']} aria-hidden />;
                              })
                            : data?.map((patio, index) => {
                                  return (
                                      <div
                                          key={patio.id}
                                          className={s.slide}
                                          role="group"
                                          aria-roledescription="slide"
                                          aria-label={`${index + 1} of ${totalSlides}`}
                                      >
                                          <FeaturedPatioCard
                                              patio={patio}
                                              shouldMountVideo={slidesInViewWithNeighbors.has(index)}
                                          />
                                      </div>
                                  );
                              })}
                    </div>
                </div>
                {hasMultipleSlides ? (
                    <>
                        <Button
                            ref={prevButtonRef}
                            isIcon
                            variant="surface"
                            size="md"
                            title="Previous featured patios"
                            data-direction="prev"
                            className={clsx(s['control-button'], s.prev)}
                            aria-controls={viewportId}
                            onClick={scrollPrev}
                        >
                            <ChevronLeftIcon />
                            <span className="sr-only">Previous featured patios</span>
                        </Button>
                        <Button
                            ref={nextButtonRef}
                            isIcon
                            variant="surface"
                            size="md"
                            title="Next featured patios"
                            data-direction="next"
                            className={clsx(s['control-button'], s.next)}
                            aria-controls={viewportId}
                            onClick={scrollNext}
                        >
                            <ChevronRightIcon />
                            <span className="sr-only">Next featured patios</span>
                        </Button>
                    </>
                ) : null}
            </div>
        </section>
    );
};
